const RELOAD_INTERVAL = 5000; // 1 секунда

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
