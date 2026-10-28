export function startGlobalLoading() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hut_loading_start"));
  }
}

export function finishGlobalLoading() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hut_loading_finish"));
  }
}

