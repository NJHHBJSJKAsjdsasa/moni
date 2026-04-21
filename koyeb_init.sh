#!/bin/bash
# This file is intended only for initial setup on Koyeb or similar platforms.
# It creates necessary configuration files and directories, then starts the application.

# Create atlas.ini configuration
echo "[Settings]" > atlas.ini
echo "seed = 1.618033988749895" >> atlas.ini
echo "cosmic_origin_time = 514080000" >> atlas.ini
echo "image_quality = 100" >> atlas.ini
echo "enable_cache = True" >> atlas.ini
echo "cache_cleanup_time = 900" >> atlas.ini

# Create internal_data directory structure
mkdir -p internal_data/p2p

# Create known_peers.json with backup-always available peers
cat > internal_data/p2p/known_peers.json << 'EOF'
{
  "last_updated": 1759145925.368958,
  "format_version": "2.0",
  "known_peers": {
    "atlas_node_bootstrap_placeholder": {
      "address": "192.0.2.1",
      "port": 5000,
      "node_id": "atlas_node_bootstrap_placeholder",
      "first_connected": 0,
      "last_connected": 0,
      "connection_count": 0,
      "handshake_version": "2.0",
      "capabilities": [],
      "cosmic_origin_time": 514080000,
      "seed": "1.618033988749895",
      "integrity_hash": "0000000000000000000000000000000000000000000000000000000000000000",
      "last_ping_ms": null,
      "preferred_protocol": "http",
      "status": "inactive",
      "last_seen": 0,
      "last_check_attempt": 0
    }
  }
}
EOF

# Start The Atlas
python3 __main__.py