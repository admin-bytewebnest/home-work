const RELOAD_INTERVAL = 8000; // 8 секунд

setInterval(() => {
  const preview = document.getElementById("previewFrame");
  const editor = document.getElementById("editorFrame");

  if (preview) {
    preview.src = preview.src.split("?")[0] + "?t=" + Date.now();
  }

  if (editor) {
    editor.src = editor.src.split("?")[0] + "?t=" + Date.now();
  }

}, RELOAD_INTERVAL);
