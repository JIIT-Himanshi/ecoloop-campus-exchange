import { LoaderCircle } from "lucide-react";

function Loader({ message = "Loading..." }) {
  return (
    <div className="loader-container">
      <LoaderCircle className="loader-icon" size={32} />
      <p>{message}</p>
    </div>
  );
}

export default Loader;
