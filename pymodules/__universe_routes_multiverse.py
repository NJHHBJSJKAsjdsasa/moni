# pymodules/__universe_routes_multiverse.py

from flask import render_template, request, redirect, url_for, session, jsonify
from pymodules.__atlas_fixed_vars import VERSION, VERSION_HASH, RUN
from pymodules.__universe_remote_explorer import get_remote_universe


def register_multiverse_routes(app):

    @app.route("/multiverse/exit")
    def exit_remote_mode():
        from pymodules.__atlas_config import config

        config.set_local_mode()
        return redirect(url_for("index"))

    @app.route("/multiverse/<node_id>/explore")
    def explore_remote_universe(node_id):

        seed = request.args.get("seed")
        seed_name = request.args.get("seed_name")
        cosmic_origin_time = request.args.get("cosmic_origin_time")

        if seed and seed_name and cosmic_origin_time:
            peer_info = {"node_id": node_id, "seed": seed, "seed_name": seed_name, "cosmic_origin_time": cosmic_origin_time}
        else:
            try:
                from pymodules.__atlas_p2pv2_integration import p2p_manager

                if p2p_manager:
                    peer_info = None
                    peers_data = p2p_manager.get_known_peers_grouped()

                    for group in peers_data.get("groups", []):
                        for peer in group.get("peers", []):
                            if peer.get("peer_id") == node_id:
                                peer_info = {"node_id": node_id, "seed": peer.get("seed"), "seed_name": group.get("seed_name", "Unknown"), "cosmic_origin_time": peer.get("cosmic_origin_time")}
                                break
                        if peer_info:
                            break
                else:
                    peer_info = None
            except ImportError:
                peer_info = None

            if not peer_info:
                try:
                    import json
                    from pathlib import Path

                    peers_file = Path("internal_data/p2p/known_peers.json")

                    if peers_file.exists():
                        with open(peers_file, "r") as f:
                            data = json.load(f)

                        if "peers" in data:
                            peers_data = data.get("peers", [])
                        elif "known_peers" in data:
                            peers_data = list(data.get("known_peers", {}).values())
                        else:
                            peers_data = []

                        from collections import defaultdict

                        groups = defaultdict(list)
                        for peer in peers_data:
                            seed_key = str(peer.get("seed", ""))
                            groups[seed_key].append(peer)

                        for seed_key, group_peers in groups.items():
                            for peer in group_peers:
                                if peer.get("peer_id") == node_id or peer.get("node_id") == node_id:
                                    seed_name = "Unknown"
                                    for p in group_peers:
                                        if p.get("seed_name"):
                                            seed_name = p["seed_name"]
                                            break

                                    peer_info = {"node_id": node_id, "seed": peer.get("seed", seed_key), "seed_name": seed_name, "cosmic_origin_time": peer.get("cosmic_origin_time", 0)}
                                    break
                            if peer_info:
                                break
                except Exception as e:
                    print(f"Error reading peers file: {e}")

        if not peer_info:
            return render_template("error.html", message=f"Universe node {node_id} not found. Please navigate from the Multiverse page.", run_mode=RUN)

        from pymodules.__atlas_config import config

        config.set_remote_mode(node_id=peer_info["node_id"], seed_str=peer_info["seed"], cosmic_origin_time=peer_info["cosmic_origin_time"], seed_name=peer_info["seed_name"])

        return redirect(url_for("index"))
