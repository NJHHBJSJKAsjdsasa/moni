# pymodules/__atlas_p2pv2_crypto.py

import os
import json
import time
import hashlib
import secrets
from typing import Dict, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.exceptions import InvalidSignature
import threading

from pymodules.__atlas_p2pv2_logger import get_p2p_logger


@dataclass
class NodeIdentity:
    node_id: str
    public_key_pem: str
    key_fingerprint: str
    created_at: float
    version: str = "1.0"


@dataclass
class SignedMessage:
    content: Dict[str, Any]
    signature: str
    timestamp: float
    nonce: str
    sender_fingerprint: str


class AtlasCryptographicManager:

    def __init__(self, data_dir: str = "p2p_data", node_id: Optional[str] = None):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)

        self.logger = get_p2p_logger(data_dir)

        self.node_id = node_id or self._find_or_generate_node_id()

        self.private_key = None
        self.public_key = None
        self.node_identity: Optional[NodeIdentity] = None

        self.known_peers: Dict[str, NodeIdentity] = {}
        self.used_nonces: set = set()
        self.blacklisted_nodes: set = set()

        self.lock = threading.Lock()

        self._initialize_keys()
        self._load_known_peers()

    def _generate_node_id(self) -> str:
        return f"atlas_node_{secrets.token_hex(16)}"

    def _find_or_generate_node_id(self) -> str:
        if not os.path.exists(self.data_dir):
            return self._generate_node_id()

        for filename in os.listdir(self.data_dir):
            if filename.endswith("_identity.json"):
                try:
                    identity_file = os.path.join(self.data_dir, filename)
                    with open(identity_file, "r") as f:
                        identity_data = json.load(f)

                    node_id = identity_data.get("node_id")
                    if node_id:
                        key_file = os.path.join(self.data_dir, f"{node_id}_private.pem")
                        if os.path.exists(key_file):
                            self.logger.initialization("CRYPTO", f"Found existing identity: {node_id}")
                            return node_id

                except Exception as e:
                    self.logger.technical_info(f"Failed to read identity file {filename}: {e}")
                    continue

        return self._generate_node_id()

    def _initialize_keys(self):
        key_file = os.path.join(self.data_dir, f"{self.node_id}_private.pem")
        identity_file = os.path.join(self.data_dir, f"{self.node_id}_identity.json")

        if os.path.exists(key_file) and os.path.exists(identity_file):
            self._load_keys(key_file, identity_file)
        else:
            self._generate_keys(key_file, identity_file)

    def _generate_keys(self, key_file: str, identity_file: str):
        self.logger.initialization("CRYPTO", f"Generating new cryptographic identity for {self.node_id}")

        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        self.public_key = self.private_key.public_key()

        public_key_pem = self.public_key.public_bytes(encoding=serialization.Encoding.PEM, format=serialization.PublicFormat.SubjectPublicKeyInfo).decode("utf-8")

        key_fingerprint = self._create_key_fingerprint(public_key_pem)

        self.node_identity = NodeIdentity(node_id=self.node_id, public_key_pem=public_key_pem, key_fingerprint=key_fingerprint, created_at=time.time())

        private_key_pem = self.private_key.private_bytes(encoding=serialization.Encoding.PEM, format=serialization.PrivateFormat.PKCS8, encryption_algorithm=serialization.NoEncryption())

        with open(key_file, "wb") as f:
            f.write(private_key_pem)

        os.chmod(key_file, 0o600)

        with open(identity_file, "w") as f:
            json.dump(asdict(self.node_identity), f, indent=2)

        self.logger.initialization("CRYPTO", f"Keys generated. Fingerprint: {key_fingerprint[:16]}...")

    def _load_keys(self, key_file: str, identity_file: str):
        try:
            with open(key_file, "rb") as f:
                self.private_key = serialization.load_pem_private_key(
                    f.read(),
                    password=None,
                )
            self.public_key = self.private_key.public_key()

            with open(identity_file, "r") as f:
                identity_data = json.load(f)
                self.node_identity = NodeIdentity(**identity_data)

            self.logger.initialization("CRYPTO", f"Loaded existing identity: {self.node_identity.key_fingerprint[:16]}...")

        except Exception as e:
            self.logger.technical_info(f"Failed to load keys: {e}")
            self._generate_keys(key_file, identity_file)

    def _create_key_fingerprint(self, public_key_pem: str) -> str:
        return hashlib.sha256(public_key_pem.encode()).hexdigest()

    def _load_known_peers(self):
        peers_file = os.path.join(self.data_dir, "known_peer_identities.json")

        if os.path.exists(peers_file):
            try:
                with open(peers_file, "r") as f:
                    peers_data = json.load(f)

                for fingerprint, peer_data in peers_data.items():
                    self.known_peers[fingerprint] = NodeIdentity(**peer_data)

                self.logger.initialization("CRYPTO", f"Loaded {len(self.known_peers)} known peer identities")

            except Exception as e:
                self.logger.technical_info(f"Failed to load known peers: {e}")

    def _save_known_peers(self):
        peers_file = os.path.join(self.data_dir, "known_peer_identities.json")

        try:
            peers_data = {fingerprint: asdict(identity) for fingerprint, identity in self.known_peers.items()}

            with open(peers_file, "w") as f:
                json.dump(peers_data, f, indent=2)

        except Exception as e:
            self.logger.technical_info(f"Failed to save known peers: {e}")

    def sign_message(self, content: Dict[str, Any]) -> SignedMessage:
        with self.lock:
            nonce = secrets.token_hex(32)
            timestamp = time.time()

            message_to_sign = {"content": content, "timestamp": timestamp, "nonce": nonce, "sender": self.node_identity.key_fingerprint}

            message_bytes = json.dumps(message_to_sign, sort_keys=True).encode("utf-8")

            signature = self.private_key.sign(message_bytes, padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH), hashes.SHA256())

            signature_hex = signature.hex()

            return SignedMessage(content=content, signature=signature_hex, timestamp=timestamp, nonce=nonce, sender_fingerprint=self.node_identity.key_fingerprint)

    def verify_message(self, signed_message: SignedMessage) -> Tuple[bool, str]:
        with self.lock:
            try:
                sender_fingerprint = signed_message.sender_fingerprint

                if sender_fingerprint not in self.known_peers:
                    return False, "Unknown sender - no public key"

                if sender_fingerprint in self.blacklisted_nodes:
                    return False, "Sender is blacklisted"

                current_time = time.time()
                time_diff = abs(current_time - signed_message.timestamp)
                if time_diff > 300:
                    return False, f"Message too old/new: {time_diff:.1f} seconds"

                nonce_key = f"{sender_fingerprint}:{signed_message.nonce}"
                if nonce_key in self.used_nonces:
                    return False, "Nonce already used (replay attack)"

                message_to_verify = {"content": signed_message.content, "timestamp": signed_message.timestamp, "nonce": signed_message.nonce, "sender": sender_fingerprint}

                message_bytes = json.dumps(message_to_verify, sort_keys=True).encode("utf-8")

                sender_identity = self.known_peers[sender_fingerprint]
                sender_public_key = serialization.load_pem_public_key(sender_identity.public_key_pem.encode("utf-8"))

                signature_bytes = bytes.fromhex(signed_message.signature)

                sender_public_key.verify(signature_bytes, message_bytes, padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH), hashes.SHA256())

                self.used_nonces.add(nonce_key)

                return True, "Signature valid"

            except InvalidSignature:
                return False, "Invalid signature"
            except Exception as e:
                return False, f"Verification error: {e}"

    def add_known_peer(self, peer_identity: NodeIdentity) -> bool:
        with self.lock:
            expected_fingerprint = self._create_key_fingerprint(peer_identity.public_key_pem)

            if expected_fingerprint != peer_identity.key_fingerprint:
                self.logger.security_alert(f"Fingerprint mismatch for peer {peer_identity.node_id}")
                return False

            if peer_identity.key_fingerprint == self.node_identity.key_fingerprint:
                return False

            self.known_peers[peer_identity.key_fingerprint] = peer_identity
            self._save_known_peers()

            self.logger.crypto_detail(f"Added peer identity: {peer_identity.node_id} ({peer_identity.key_fingerprint[:16]}...)")
            return True

    def create_challenge(self, target_peer_fingerprint: Optional[str] = None) -> Dict[str, Any]:
        challenge_data = {"challenge_id": secrets.token_hex(16), "random_data": secrets.token_hex(32), "timestamp": time.time(), "challenger": self.node_identity.key_fingerprint}

        if target_peer_fingerprint:
            challenge_data["target"] = target_peer_fingerprint

        return challenge_data

    def respond_to_challenge(self, challenge: Dict[str, Any]) -> Optional[SignedMessage]:
        try:
            response_content = {"challenge_id": challenge["challenge_id"], "challenge_response": hashlib.sha256(f"{challenge['random_data']}:{self.node_identity.key_fingerprint}".encode()).hexdigest(), "responder": self.node_identity.key_fingerprint}

            return self.sign_message(response_content)

        except Exception as e:
            self.logger.crypto_detail(f"Failed to respond to challenge: {e}")
            return None

    def verify_challenge_response(self, challenge: Dict[str, Any], response: SignedMessage) -> bool:
        try:
            is_valid, error = self.verify_message(response)
            if not is_valid:
                self.logger.crypto_detail(f"Challenge response signature invalid: {error}")
                return False

            if response.content.get("challenge_id") != challenge["challenge_id"]:
                self.logger.crypto_detail("Challenge ID mismatch")
                return False

            expected_response = hashlib.sha256(f"{challenge['random_data']}:{response.sender_fingerprint}".encode()).hexdigest()

            if response.content.get("challenge_response") != expected_response:
                self.logger.crypto_detail("Challenge response hash invalid")
                return False

            return True

        except Exception as e:
            self.logger.crypto_detail(f"Challenge verification error: {e}")
            return False

    def blacklist_node(self, node_fingerprint: str):
        with self.lock:
            self.blacklisted_nodes.add(node_fingerprint)
            self.logger.security_alert(f"Blacklisted node: {node_fingerprint[:16]}...")

    def get_identity(self) -> NodeIdentity:
        return self.node_identity

    def get_statistics(self) -> Dict[str, Any]:
        with self.lock:
            return {"node_fingerprint": self.node_identity.key_fingerprint, "known_peers": len(self.known_peers), "used_nonces": len(self.used_nonces), "blacklisted_nodes": len(self.blacklisted_nodes), "identity_created": self.node_identity.created_at}

    def cleanup_old_nonces(self, max_age: int = 3600):
        if len(self.used_nonces) > 10000:
            self.used_nonces.clear()
