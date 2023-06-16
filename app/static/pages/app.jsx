import React from 'react';
import { createRoot } from 'react-dom/client';
import ReactDOM from 'react-dom';

import Application from "./Components/Application";

const root = createRoot(document.getElementById("root"));

root.render(
    <React.StrictMode>{/*Remove when building production */}
        <Application />
    </React.StrictMode>
);