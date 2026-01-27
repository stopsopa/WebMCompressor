

allow to inject extra params from UI

track progress of two ffmpeg commands


Stage 1: Pass 1 (Analysis)
    UI Component: A "scanning" or "pulsing" progress bar (the kind that slides back and forth).
    Label: "Analyzing video (Pass 1 of 2)..."
    Logic: You just wait for the first process to exit. You know it's working because the process is still running and consuming CPU.
Stage 2: Pass 2 (Encoding)
    UI Component: A standard percentage bar (0% to 100%).
    Label: "Compressing (Pass 2 of 2)..."
    Logic: This pass will output real out_time_us values immediately, and you can calculate the progress exactly as we discussed.



