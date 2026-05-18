import "@/App.css";
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "@/pages/Landing";
import GatePage from "@/pages/GatePage";

function App() {
    const [stage, setStage]     = useState("gate");
    const [gateData, setGateData] = useState(null);

    const handleGateComplete = (data) => {
        setGateData(data);
        setStage("vsl");
    };

    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={
                            stage === "gate"
                                ? <GatePage onComplete={handleGateComplete} />
                                : <Landing gateData={gateData} />
                        }
                    />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
