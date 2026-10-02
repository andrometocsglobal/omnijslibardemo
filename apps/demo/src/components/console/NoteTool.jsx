import { useEffect, useImperativeHandle, useRef, useState } from "react";
import O from "../../omni.js";

const ROWS = ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM,.?"];
const secure = new O.EncryptedStore(O.createStore("omnidim-console", "notes"));

/** Air-keyboard notepad: hover a key and pinch to type. Notes are AES-GCM encrypted at rest. */
export default function NoteTool({ ref, zoom }) {
  const [text, setText] = useState("");
  const [caps, setCaps] = useState(true);
  const [status, setStatus] = useState("");
  const history = useRef([]);
  const areaRef = useRef(null);

  useEffect(() => {
    secure.get("note").then((t) => typeof t === "string" && setText(t)).catch(() => {});
  }, []);

  const put = (next) => {
    history.current.push(text);
    if (history.current.length > 200) history.current.shift();
    setText(next);
  };
  const type = (k) => put(text + (caps ? k : k.toLowerCase()));

  const save = async () => {
    await secure.set("note", text);
    setStatus(`Encrypted & saved locally · ${new Date().toLocaleTimeString()}`);
  };

  useImperativeHandle(ref, () => ({
    undo() {
      const prev = history.current.pop();
      if (prev !== undefined) setText(prev);
    },
    save,
    pan(dx, dy) {
      areaRef.current?.scrollBy(0, -dy);
      return true;
    },
  }));

  return (
    <div className="tool">
      <div className="tool-bar">
        <button data-holo className="holo-btn sm" onClick={save}>SAVE</button>
        <button data-holo className="holo-btn sm" onClick={() => put("")}>CLEAR</button>
        <button data-holo className="holo-btn sm" onClick={() => navigator.clipboard?.writeText(text)}>COPY</button>
        <span className="holo-readout">{text.length} chars · {status || "notes are encrypted with AES-GCM (non-extractable key)"}</span>
      </div>
      <div className="tool-surface note-surface" style={{ transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})` }}>
        <textarea ref={areaRef} className="note-area" value={text} onChange={(e) => put(e.target.value)} placeholder="Type with the air keyboard (pinch a key) or your keyboard…" />
        <div className="air-keyboard">
          {ROWS.map((row) => (
            <div key={row} className="kb-row">
              {[...row].map((k) => (
                <button key={k} data-holo className="key" onClick={() => type(k)}>{caps ? k : k.toLowerCase()}</button>
              ))}
            </div>
          ))}
          <div className="kb-row">
            <button data-holo className={`key wide ${caps ? "on" : ""}`} onClick={() => setCaps((c) => !c)}>⇧ CAPS</button>
            <button data-holo className="key space" onClick={() => put(text + " ")}>SPACE</button>
            <button data-holo className="key wide" onClick={() => put(text.slice(0, -1))}>⌫</button>
            <button data-holo className="key wide" onClick={() => put(text + "\n")}>⏎</button>
          </div>
        </div>
      </div>
    </div>
  );
}
