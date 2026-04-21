# pymodules/__atlas_p2pv2_anim.py

import sys
import time
import threading


def animate_initialization(text="Initializing Multiverse Protocol..."):
    chars = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
    stop_animation = threading.Event()

    def animate():
        i = 0
        while not stop_animation.is_set():
            sys.stdout.write(f"\r {chars[i % len(chars)]} {text}")
            sys.stdout.flush()
            time.sleep(0.03)
            i += 1
        sys.stdout.write("\r" + " " * (len(text) + 4) + "\r")
        sys.stdout.flush()

    animation_thread = threading.Thread(target=animate)
    animation_thread.start()

    return stop_animation, animation_thread


def stop_animation(stop_event, anim_thread):
    if stop_event and not stop_event.is_set():
        stop_event.set()
        if anim_thread and anim_thread.is_alive():
            anim_thread.join()
