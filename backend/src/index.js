import dotenv from "dotenv"

dotenv.config({
    path: "./.env"
})

import app  from "./app.js"

const port = process.env.PORT || 3000

app.listen(port || 5000, () => {
  console.log(`Server is running on port ${port}`);
});