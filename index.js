const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
// const { Client } = require("@googlemaps/google-maps-services-js");
const { createHash, randomBytes } = require("crypto");
// const { Email } = require("./email/email");
// const { Upload, uploadFile } = require("./uploadFile");
const mime = require("mime-types");

dotenv.config();
const client = new Client({});
const app = express();

const CyclicDb = require("@cyclic.sh/dynamodb");
const db = CyclicDb("nice-long-underwear-bassCyclicDB");

const signAccessToken = (key) => {
  const jwtSecret = "wzPe7g19Yan27T2ATud1Kw==";
  return jwt.sign({ key: key }, jwtSecret, {
    expiresIn: "3h",
  });
};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const treatableDiseases = [
  "malaria",
  "tuberculosis",
  "covid 19",
  "aids",
  "cancer",
  "cholera",
  "measles",
  "ebola",
  "yellow fever",
  "flu",
  "cough",
  "typhoid",
  "urinary tract infection (uti)",
  "prostate disorder",
  "anemia",
].sort();

function binarySearch(arr, diseaseInput) {
  const disease = diseaseInput.toLowerCase();
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const midVal = arr[mid];

    if (midVal === disease) {
      return mid;
    } else if (midVal < disease) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}
const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(express.static('public', options))

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`index.js listening on ${port}`);
});
app.get("/", async (req, res) => {
  // testing code on server
  res.json({ msg: "hello world" }).end();
});

app.post("/api", async (req, res) => {
  const { name, email } = req.body;
  const result = await db.putItem({ name, email });
  res.json(result).end();
});

// app.post('/:col/:key', async (req, res) => { // deleting a key from a collection
//   console.log(req.body)

//   const col = req.params.col
//   const key = req.params.key
//   console.log(`from collection: ${col} delete key: ${key} with params ${JSON.stringify(req.params)}`)
//   const item = await db.collection(col).set(key, req.body)
//   console.log(JSON.stringify(item, null, 2))
//   res.json(item).end()
// })
app.post("/clients/new", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const client = await db.collection("doceaseclients").get(email);

    // If the user exists, return a message
    if (client) {
      res.status(400).json({ success: false, message: "User already exists." });
      return;
    }

    const saltRounds = 12;
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Replace the plain password with the hashed version
    req.body.password = hashedPassword;

    // Store the user in the database
    const result = await db.collection("doceaseclients").set(email, req.body);
    console.log(JSON.stringify(result, null, 2));

    // await new Email(email, "Welcome").sendWelcome(req.body.fullName);

    res.json({
      success: true,
      message: "User added successfully.",
      data: { added: true },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

function getFirstTenHospitals(inputArray) {
  return inputArray.slice(0, 10);
}

// Get hospitals/health facilities within given radius using googlemaps
// TODO: include the pre check middle to check for disease with associated hospitals
app.get("/near-by-places", authorize, async (req, res) => {
  const latitude = req.query.latitude;
  const longitude = req.query.longitude;
  const disease = req.query.disease;

  // Temporary storage for the last searched disease
  let lastSearchedDisease = null;
  let healthFacilities = null; // Initializing the  healthFacilities

  try {
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Please provide location coordinates",
      });
    }

    // Check if disease is provided and commonly treated in Uganda
    if (disease) {
      const formattedDisease =
        disease.charAt(0).toUpperCase() + disease.slice(1).toLowerCase();
      const isTreatable =
        binarySearch(treatableDiseases, formattedDisease) !== -1;

      // If the disease is not treatable in Uganda, return a message indicating so
      if (!isTreatable) {
        return res.status(400).json({
          success: true,
          message: `The disease '${formattedDisease}' is not commonly treated in Uganda.`,
          data: [],
        });
      }

      // If the disease is the same as the last searched disease, we do not shuffle the results
      if (lastSearchedDisease === formattedDisease) {
        return res.status(200).json({
          success: true,
          message: "Health facilities found successfully",
          data: healthFacilities ? healthFacilities.data : [],
        });
      }

      // If the disease is different,we shuffle the results and update the last searched disease
      lastSearchedDisease = formattedDisease;
      if (
        healthFacilities &&
        healthFacilities.data &&
        healthFacilities.data.results
      ) {
        shuffleArray(healthFacilities.data.results);
      }
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a disease" });
    }

    const email = res.locals.key;
    const resultKey = `${disease.toLocaleLowerCase()}-${email}`;
    console.log("resultKey", resultKey);
    // check for disease in the database
    const dbSearchResults = await db.collection("searchresults").get(resultKey);

    const isExpiredSearchResults =
      new Date(Date.now()) > new Date(dbSearchResults?.props.expiresAt);

    // delete when results are expired
    if (isExpiredSearchResults) {
      await db.collection("searchresults").delete(resultKey);
    }

    // Return search results from the database
    if (
      dbSearchResults?.props.latitude == latitude &&
      dbSearchResults?.props.longitude == longitude &&
      !isExpiredSearchResults
    ) {
      return res.status(200).json({
        success: true,
        message: "Health facilities found successfully",
        data: dbSearchResults.props.searchResults,
      });
    }

    // Proceeding with finding health facilities
    // healthFacilities = await client.placesNearby({
    //   params: {
    //     location: `${latitude}, ${longitude}`,
    //     key: process.env.GOOGLE_MAPS_API_KEY,
    //     radius: 1000,
    //     types: ["hospital", "health"],
    //   },
    // });

    if (healthFacilities.statusText !== "OK") {
      return res
        .status(400)
        .json({ success: false, message: "Could not find places" });
    }

    // shuffle the array
    shuffleArray(healthFacilities.data.results);
    // take first 10 hospitals
    const hospitals = getFirstTenHospitals(healthFacilities.data.results);

    healthFacilities.data.results = hospitals;

    const params = {
      latitude: latitude,
      longitude: longitude,
      disease: disease,
      email: email,
      searchResults: healthFacilities.data,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    await db.collection("searchresults").set(resultKey, params);

    res.status(200).json({
      success: true,
      message: "Health facilities found successfully",
      data: healthFacilities.data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post("/users/forgot-password", async (req, res) => {
  try {
    const email = req.body.email;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email" });
    }
    const user = await db.collection("doceaseclients").get(email);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "There is no user with supplied email",
      });
    }
    const resetToken = randomBytes(32).toString("hex");

    const passwordResetToken = createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const passwordResetExpires = new Date(
      Date.now() + 20 * 60 * 1000
    ).toISOString();

    const params = {
      passwordResetToken: passwordResetToken,
      passwordResetExpires: passwordResetExpires,
    };
    // save passwordResetToken and passwordResetExpires in database
    const result = await db.collection("doceaseclients").set(email, params); //To confirm

    // const resetURL = `${req.protocol}://localhost:5173/reset-password/${resetToken}`;
    const resetURL = `${req.protocol}://docease.netlify.app/reset-password/${email}/${resetToken}`;
    const subject = "Reset Password";

    console.log("resetURL");
    console.log(resetURL);

    const fullName = user.props.fullName;

    await new Email(email, subject).sendPasswordReset(resetURL, fullName);

    res.status(200).json({
      success: true,
      message: "Password reset token sent to mail",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post("/users/reset-password/:key/:token", async (req, res) => {
  try {
    const key = req.params.key;
    const token = req.params.token;

    if (!key)
      return res.status(400).json({
        success: false,
        message: "Please provide the password reset key",
      });

    if (!token)
      return res.status(400).json({
        success: false,
        message: "Please provide the reset token",
      });

    const user = await db.collection("doceaseclients").get(key);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "We could'nt that matches provided key",
      });
    }
    const hashedToken = createHash("sha256").update(token).digest("hex");
    const savedToken = user.props?.passwordResetToken;

    if (hashedToken !== savedToken) {
      return res.status(400).json({
        success: false,
        message: "Token provided is invalid",
      });
    }

    const passwordResetExpiry = new Date(user.props.passwordResetExpires);
    const currentDate = new Date();

    if (passwordResetExpiry < currentDate) {
      return res.status(400).json({
        success: false,
        message: "Token  has expired",
      });
    }
    const newPassword = req.body.password;
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide password",
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const params = {
      passwordResetToken: null,
      passwordResetExpires: null,
      password: hashedPassword,
    };

    const email = user.props.email;
    await db.collection("doceaseclients").set(email, params); //To confirm

    res
      .status(200)
      .json({ success: true, message: "password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: true, message: "Internal server error." });
  }
});

// update profile
app.patch("/users/update-profile", authorize, async (req, res) => {
  const key = res.locals.key;

  const fullName = req.body.fullName;
  const email = req.body.email;
  if (!fullName || !email) {
    return res
      .status(400)
      .json({ success: false, message: "Please fill out all fields" });
  }
  let user = await db.collection("doceaseclients").get(key);

  if (user.props.email !== email) {
    user = await db.collection("doceaseclients").get(email);
    if (user) {
      return res.status(400).json({
        success: false,
        message: "Can't update to already registered email",
      });
    }
  }

  const params = {
    email: email,
    fullName: fullName,
  };

  await db.collection("doceaseclients").set(key, params);

  res.status(200).json({
    status: "success",
    user,
  });
});

// change password
app.patch("/users/update-password", authorize, async (req, res) => {
  const key = res.locals.key;
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  const user = await db.collection("doceaseclients").get(key);

  if (!(await bcrypt.compare(currentPassword, user.props.password))) {
    return res.status(403).json({
      success: false,
      message: "Wrong current password",
    });
  }
  if (await bcrypt.compare(newPassword, user.props.password)) {
    return res.status(403).json({
      success: false,
      message: "New password same as current password",
    });
  }

  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  const params = {
    password: hashedPassword,
  };

  await db.collection("doceaseclients").set(key, params);

  res
    .status(200)
    .json({ success: true, message: "Password changed successfully" });
});

app.post("/users/profile-picture", authorize, uploadFile, async (req, res) => {
  try {
    const file = req.file;
    const key = res.locals.key;

    if (file == undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide your profile picture !",
      });
    }

    const mimeType = mime.lookup(file.originalname);
    const isImage = mimeType && mimeType.startsWith("image");
    if (!isImage) {
      return res.status(400).json({
        success: false,
        message: "Please provide file of image type !",
      });
    }

    const imagePath = `users/${Date.now()}_${file.originalname}`;
    const upload = await new Upload(imagePath).add(file);
    const url = upload?.url;

    const params = {
      imageUrl: url,
      imagePath: imagePath,
    };

    await db.collection("doceaseclients").set(key, params);

    const user = await db.collection("doceaseclients").get(key);

    user.props.password = undefined;
    user.props.passwordResetToken = undefined;
    user.props.passwordResetExpires = undefined;
    user.props.imagePath = undefined;
    user.props.imageUrl = url;

    res.status(200).json({
      status: "success",
      message: `Photo uploaded successfully`,
      data: {
        user: user.props,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.patch("/users/profile-picture", authorize, uploadFile, async (req, res) => {
  try {
    const file = req.file;
    const key = res.locals.key;
    if (file == undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide your profile picture !",
      });
    }

    const mimeType = mime.lookup(file.originalname);
    const isImage = mimeType && mimeType.startsWith("image");
    if (!isImage) {
      return res.status(400).json({
        success: false,
        message: "Please provide file of image type !",
      });
    }

    const user = await db.collection("doceaseclients").get(key);

    const savedImagePath = user.props.imagePath;

    const imagePath = `users/${Date.now()}_${file.originalname}`;
    const upload = await new Upload(imagePath).update(file, savedImagePath);
    const url = upload?.url;

    const params = {
      imageUrl: url,
      imagePath: imagePath,
    };

    await db.collection("doceaseclients").set(key, params);

    user.props.password = undefined;
    user.props.passwordResetToken = undefined;
    user.props.passwordResetExpires = undefined;
    user.props.imagePath = undefined;
    user.props.imageUrl = url;

    res.status(200).json({
      status: "success",
      message: `Photo uploaded successfully`,
      data: {
        user: user.props,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

async function authorize(req, res, next) {
  const authHeader = req.headers["authorization"];
  let token;
  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
  }
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "You are not logged! Please to get access",
    });
  }
  const jwtSecret = "wzPe7g19Yan27T2ATud1Kw==";

  const decoded = jwt.verify(token, jwtSecret);

  const tokenExpiry = decoded.exp; //seconds
  const now = Math.floor(Date.now() / 1000); //seconds

  if (now > tokenExpiry) {
    return res.status(403).json({
      success: false,
      message: "You token has expired. please again to get access",
    });
  }

  // check for expiry

  const user = await db.collection("doceaseclients").get(decoded.key);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "The user belonging to this token no exists!",
    });
  }

  res.locals.key = decoded.key;
  next();
}

app.get("/:col/:key", async (req, res) => {
  // getting a key from a collection
  const col = req.params.col;
  const key = req.params.key;
  console.log(
    `from collection: ${col} get key: ${key} with params ${JSON.stringify(
      req.params
    )}`
  );
  const item = await db.collection(col).get(key);
  console.log(JSON.stringify(item, null, 2));
  res.json(item).end();
});

app.get("/:col", async (req, res) => {
  // listing a collection
  const col = req.params.col;
  console.log(
    `list collection: ${col} with params: ${JSON.stringify(req.params)}`
  );
  const items = await db.collection(col).list();
  console.log(JSON.stringify(items, null, 2));
  res.json(items).end();
});

app.post("collection/:colName", async (req, res) => {
  // creating a collection
  const { colName } = req.params;
  const newCollection = await db.collection(colName);
  console.log(JSON.stringify(newCollection, null, 2));
  res.json(newCollection).end();
});

app.delete("collection/:colName", async (req, res) => {
  // deleting a collection
  const { colName } = req.params;
  // try{}
  await db.delete(colName);
  console.log(JSON.stringify(newCollection, null, 2));
  res.json(newCollection).end();
});

app.post("/login", async (req, res) => {
  // login
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Both email and password are required.",
    });
  }

  try {
    // Fetch the client data from the database using the provided email
    const student = await db.collection("doceaseclients").get(email);

    // If the student doesn't exist or passwords don't match, return an error
    if (!student || student.props.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    // If everything is okay, return a success message (and possibly a token or any other data)
    res.json({
      success: true,
      message: "Login successful.",
      data: { firstname: student.props.firstname },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// deleting a user if they exist
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection("doceaseclients").delete(id);
    res.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Fetching the client with the provided email
    const client = await db.collection("doceaseclients").get(email);
    if (client) {
      const passwordMatch = await bcrypt.compare(
        password,
        client.props.password
      );
      if (!passwordMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid password entered." });
      } else {
        // return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        const accessToken = signAccessToken(client.key);
        return res.status(200).json({
          success: true,
          message: "Login successful.",
          data: { client },
          accessToken: accessToken,
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: `Email adress not found, if you don't have an account please sign up.`,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// verifying if email already exists in the database
app.post("/users/verify", async (req, res) => {
  const { email } = req.body;

  try {
    const student = await db.collection("doceaseclients").get(email);
    res.json({
      success: true,
      message: "User verified successfully.",
      data: { exists: !!student },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});