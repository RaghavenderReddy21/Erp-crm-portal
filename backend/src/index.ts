import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";

const app = createApp();
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`ERP/CRM backend listening on port ${port}`);
});
