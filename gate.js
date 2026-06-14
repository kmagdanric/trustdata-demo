// Lightweight client-side gate (obscurity, not real security).
// Default password: trustdata!demo  — change PASS_HASH below.
// Generate a new hash:  python3 -c "import hashlib;print(hashlib.sha256('YOURPW'.encode()).hexdigest())"
const PASS_HASH = "d3fe6c8e9e6113df4902d5cd79592cb1b24cabd08ac749364e5670f1855a5317";
const GATE_KEY = "td_gate_ok";

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function tryUnlock(pw) {
  if (await sha256(pw) === PASS_HASH) {
    sessionStorage.setItem(GATE_KEY, "1");
    document.getElementById("gate").remove();
    return true;
  }
  return false;
}

function buildGate() {
  if (sessionStorage.getItem(GATE_KEY) === "1") return;
  const g = document.createElement("div");
  g.id = "gate";
  g.innerHTML = `
    <div class="gate-box">
      <div class="gate-title">TRUST<span>data</span> · 비공개 미리보기</div>
      <input id="gate-pw" type="password" placeholder="접근 비밀번호" autofocus />
      <button id="gate-btn">입장</button>
      <div id="gate-err"></div>
    </div>`;
  document.body.appendChild(g);
  const submit = async () => {
    const ok = await tryUnlock(document.getElementById("gate-pw").value);
    if (!ok) document.getElementById("gate-err").textContent = "비밀번호가 올바르지 않습니다.";
  };
  document.getElementById("gate-btn").onclick = submit;
  document.getElementById("gate-pw").onkeydown = e => { if (e.key === "Enter") submit(); };
}
buildGate();
</content>
