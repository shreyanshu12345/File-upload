const blinkStyle = {
  display: "inline-block",
  animation: "fu-blink 1s step-end infinite",
  color: "#f59e0b",
  marginLeft: 2,
};

/** Animated block cursor — used in the log terminal. */
export default function Blink() {
  return <span style={blinkStyle}>█</span>;
}
