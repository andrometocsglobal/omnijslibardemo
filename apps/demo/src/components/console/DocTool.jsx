import { useEffect, useImperativeHandle, useRef, useState } from "react";
import O from "../../omni.js";

const secure = new O.EncryptedStore(O.createStore("omnidim-console", "docs"));

const STARTER = `<h1>Omnidimensional Notes</h1>
<p>Pinch a toolbar button to format. Make a <b>fist</b> and move to scroll. Use a <b>two-hand pinch</b> to zoom.</p>
<h2>Four formula families</h2>
<ul><li>AP — S = N·(first+last)/2</li><li>GP — S = a(rⁿ−1)/(r−1)</li><li>HP — H(N) ≈ ln N + γ + 1/(2N) − …</li><li>Geometry — V(d) = k(d)·s^d</li></ul>`;

/** Word-style rich document editor operated by gestures (or mouse/keyboard). */
export default function DocTool({ ref, zoom }) {
  const editorRef = useRef(null);
  const [status, setStatus] = useState("");
  const [words, setWords] = useState(0);

  useEffect(() => {
    secure
      .get("doc")
      .then((html) => {
        editorRef.current.innerHTML = typeof html === "string" ? html : STARTER;
        count();
      })
      .catch(() => {
        editorRef.current.innerHTML = STARTER;
      });
  }, []);

  const count = () => setWords((editorRef.current?.innerText.trim().match(/\S+/g) ?? []).length);
  const exec = (cmd, arg) => {
    editorRef.current.focus();
    document.execCommand(cmd, false, arg);
    count();
  };
  const save = async () => {
    await secure.set("doc", editorRef.current.innerHTML);
    setStatus(`Encrypted & saved · ${new Date().toLocaleTimeString()}`);
  };
  const exportHtml = () => {
    const blob = new Blob([`<!doctype html><meta charset="utf-8"><title>OMNIDIM document</title>${editorRef.current.innerHTML}`], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "omnidim-document.html";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  useImperativeHandle(ref, () => ({
    undo: () => exec("undo"),
    save,
    pan(dx, dy) {
      editorRef.current?.parentElement?.scrollBy(-dx, -dy);
      return true;
    },
  }));

  const B = ({ cmd, arg, children }) => (
    <button data-holo className="holo-btn sm" onMouseDown={(e) => e.preventDefault()} onClick={() => exec(cmd, arg)}>{children}</button>
  );

  return (
    <div className="tool">
      <div className="tool-bar">
        <B cmd="formatBlock" arg="H1">H1</B>
        <B cmd="formatBlock" arg="H2">H2</B>
        <B cmd="formatBlock" arg="P">¶</B>
        <B cmd="bold">B</B>
        <B cmd="italic">I</B>
        <B cmd="underline">U</B>
        <B cmd="insertUnorderedList">• LIST</B>
        <B cmd="insertOrderedList">1. LIST</B>
        <B cmd="justifyCenter">CENTER</B>
        <B cmd="undo">UNDO</B>
        <button data-holo className="holo-btn sm" onClick={save}>SAVE</button>
        <button data-holo className="holo-btn sm" onClick={exportHtml}>EXPORT</button>
        <span className="holo-readout">{words} words · {status || "encrypted local storage"}</span>
      </div>
      <div className="doc-scroll">
        <div className="tool-surface doc-surface" style={{ transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})`, transformOrigin: "top center" }}>
          <div ref={editorRef} className="doc-page" contentEditable suppressContentEditableWarning onInput={count} />
        </div>
      </div>
    </div>
  );
}
