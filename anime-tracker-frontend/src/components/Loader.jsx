import "./Loader.css";

function Loader() {
  return (
    <div className="loader-container">
      <img src="/app-loader.gif" alt="Loading..." className="loader-img" />
      <p className="loader-text">Loading your anime world...</p>
    </div>
  );
}

export default Loader;