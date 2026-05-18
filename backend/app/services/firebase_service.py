import json
import time
import urllib.request
from typing import Dict, Any, Optional
from jose import jwt, JWTError
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

GOOGLE_KEYS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

class FirebaseService:
    def __init__(self):
        self._cached_keys: Dict[str, str] = {}
        self._keys_expiry: float = 0.0

    def _fetch_google_public_keys(self) -> Dict[str, str]:
        """Fetch Google's public certificates and extract their public keys in PEM format."""
        now = time.time()
        # If cache is valid, return it
        if self._cached_keys and now < self._keys_expiry:
            return self._cached_keys

        try:
            logger.info("Fetching Google public certificates for Firebase ID Token verification...")
            req = urllib.request.Request(
                GOOGLE_KEYS_URL,
                headers={"User-Agent": "Locker24-Backend-Auth"}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                certs = json.loads(response.read().decode("utf-8"))
                # Parse Cache-Control header to get max-age
                cache_control = response.headers.get("Cache-Control", "")
                max_age = 3600  # default 1 hour
                for part in cache_control.split(","):
                    if "max-age" in part:
                        try:
                            max_age = int(part.split("=")[1].strip())
                        except Exception:
                            pass
                
                self._keys_expiry = now + max_age
                
                # Convert the certificates (x509 PEM strings) to standard public keys in PEM format
                new_keys = {}
                for kid, cert_pem in certs.items():
                    try:
                        cert_obj = x509.load_pem_x509_certificate(
                            cert_pem.encode("utf-8"),
                            default_backend()
                        )
                        public_key = cert_obj.public_key()
                        public_pem = public_key.public_bytes(
                            encoding=serialization.Encoding.PEM,
                            format=serialization.PublicFormat.SubjectPublicKeyInfo
                        ).decode("utf-8")
                        new_keys[kid] = public_pem
                    except Exception as e:
                        logger.error(f"Failed to parse cert for kid {kid}: {e}")
                
                if new_keys:
                    self._cached_keys = new_keys
                    logger.info(f"Successfully cached {len(self._cached_keys)} Google public keys. Expiry in {max_age} seconds.")
                return self._cached_keys

        except Exception as e:
            logger.error(f"Error fetching Google public keys: {e}")
            # If fetch fails but we have stale cached keys, use them as backup
            if self._cached_keys:
                logger.warning("Using stale cached public keys as fallback")
                return self._cached_keys
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication server currently unavailable. Please try again later."
            )

    def verify_id_token(self, id_token: str, project_id: Optional[str]) -> Dict[str, Any]:
        """
        Verify a Firebase ID Token manually.
        If project_id is None or empty, we log a warning and run in local developer debug bypass mode.
        """
        if not project_id:
            logger.warning("FIREBASE_PROJECT_ID not set. Running in development/demo bypass mode.")
            # In bypass mode, we decode the token without verifying signature just to extract claims.
            try:
                # Basic JWT decode without validation (only used when Firebase project is not configured)
                claims = jwt.get_unverified_claims(id_token)
                return claims
            except JWTError as e:
                logger.error(f"Failed to decode unverified token: {e}")
                # Fallback to returning a mock payload if decoding fails (for clean dev testing)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid auth credential payload."
                )

        try:
            # 1. Fetch Google's public certificates
            public_keys = self._fetch_google_public_keys()

            # 2. Extract Key ID (kid) from token header
            header = jwt.get_unverified_header(id_token)
            kid = header.get("kid")
            if not kid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token structure: missing key identifier (kid)."
                )

            # 3. Match Key ID with cached keys
            public_pem = public_keys.get(kid)
            if not public_pem:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token signed by an unrecognized key. Try logging in again."
                )

            # 4. Decode and verify signature & claims using RS256
            expected_issuer = f"https://securetoken.google.com/{project_id}"
            
            claims = jwt.decode(
                id_token,
                public_pem,
                algorithms=["RS256"],
                audience=project_id,
                issuer=expected_issuer
            )
            
            # Additional validation of subject (sub)
            if not claims.get("sub"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token is missing subject identifier."
                )

            return claims

        except JWTError as e:
            logger.error(f"Firebase token verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Google authentication failed: {str(e)}"
            )

firebase_service = FirebaseService()
