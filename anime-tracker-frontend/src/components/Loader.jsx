import "./Loader.css";
import loader from "../assets/Loader.gif";

function Loader() {
  return (
    <div className="loader-container">
      <img src={loader} alt="Loading..." className="loader-img" />
      <p className="loader-text">Loading your anime world...</p>
    </div>
  );
}

export default Loader;