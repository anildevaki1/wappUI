const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { phoneNumberFormatter } = require('./helpers/formatter');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const { json } = require('express/lib/response');
const { doesNotMatch } = require('assert');
const { extension } = require('mime-types');
const { error } = require('console');
const port = process.env.PORT || 8000;

const ApiServer = "http://localhost:45608/";

const app = express();
app.use(express.static('myapp'));
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));

app.use(fileUpload({
  debug: false
}));


app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const sessions = [];
const SESSIONS_FILE = './whatsapp-sessions.json';
const MIME_FILE = './mimetypes.json';

const createSessionsFileIfNotExists = function () {
  if (!fs.existsSync(SESSIONS_FILE)) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
      console.log('Sessions file created successfully.');
    } catch (err) {
      console.log('Failed to create sessions file: ', err);
    }
  }
}

createSessionsFileIfNotExists();


const setSessionsFile = function (currClient) {
  fs.writeFile(SESSIONS_FILE, JSON.stringify(currClient), function (err) {
    if (err) {
      console.log(err);
    }
  });
}

const getSessionsFile = function () {
  if (fs.readFileSync(SESSIONS_FILE, function (err) {
    if (err) {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
    }
  }))
    return JSON.parse(fs.readFileSync(SESSIONS_FILE));

}


const getMimeiFile = function () {
  if (fs.readFileSync(MIME_FILE, function (err) {
    if (err) {
      fs.writeFileSync(MIME_FILE, JSON.stringify([]));
    }
  }))
    return JSON.parse(fs.readFileSync(MIME_FILE));

}


const createSession = function (id) {

  const client = new Client({
    restartOnAuthFail: true,
    qrTimeoutMs: 0,
    authTimeoutMs: 0,
    takeoverOnConflict: true,
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        // '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu',
        '--unhandled-rejections=strict'
      ],
    },
    authStrategy: new LocalAuth({
      clientId: id
    })
  });


  client.initialize();

  client.on('qr', (qr) => {
    // const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    console.log(qr);
    qrcode.toDataURL(qr, (err, url) => {
      io.emit('qr', { id: id, src: url });
      io.emit('message', { id: id, text: 'QR Code received, scan please!' });
    });

  });


  client.on('ready', () => {
    io.emit('ready', { id: id });
    // io.emit('message', { id: id, text: 'Whatsapp is ready!' });


    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    if (sessionIndex >= 0) {
      savedSessions[sessionIndex].ready = true;
      setSessionsFile(savedSessions);
    }
    //savedSessions[sessionIndex].info = JSON.stringify(client.info);
  });

  client.on('authenticated', () => {
    io.emit('authenticated', { id: id });
    io.emit('message', { id: id, text: 'Whatsapp is authenticated!' });
  });

  client.on('auth_failure', function () {
    io.emit('message', { id: id, text: 'Auth failure, restarting...' });
  });

  client.on('disconnected', () => {
    io.emit('message', { id: id, text: 'Whatsapp is disconnected!' });
    io.emit('remove-session', id);
    client.destroy();
    client.initialize();

    // Menghapus pada file sessions
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    savedSessions.splice(sessionIndex, 1);
    setSessionsFile(savedSessions);




  });



  // Tambahkan client ke sessions
  // var idx = sessions.findIndex(f => f.id == id);
  // if (idx == -1)
  sessions.push({
    id: id,
    client: client
  });
  // else
  //   sessions[idx].client = client;

  // Menambahkan session ke file
  const savedSessions = getSessionsFile();
  const sessionIndex = savedSessions.findIndex(sess => sess.id == id);

  if (sessionIndex == -1) {
    savedSessions.push({
      id: id,
      ready: false,
    });

    setSessionsFile(savedSessions);

    // var dataDir = "./.wwebjs_auth/session-" + id;
    // deleteFolderRecursive(dataDir);
    // if (fs.existsSync(dataDir)) {

    //   if (dataDir) {
    //     fs.rm(dataDir, { recursive: true, force: true });
    //     //(fs.rmSync ? fs.rmSync : fs.rmdirSync).call(dataDir, { recursive: true })
    //   }
    // }
  }
}

// const deleteFolderRecursive = function (directoryPath) {
//   if (fs.existsSync(directoryPath)) {
//       fs.readdirSync(directoryPath).forEach((file, index) => {

//         const curPath = path.join(directoryPath, file);
//         if (fs.lstatSync(curPath).isDirectory()) {
//          // recurse
//           deleteFolderRecursive(curPath);
//         } else {
//           // delete file
//           fs.unlinkSync(curPath);
//         }
//       });
//       fs.rmdirSync(directoryPath);
//     }
//   };
const init = function (socket) {

  const savedSessions = getSessionsFile();

  if (savedSessions.length > 0) {
    if (socket) {

      socket.emit('init', savedSessions);
    } else {
      savedSessions.forEach(sess => {
        createSession(sess.id);
      });
    }
  }
}




const close = function (data) {
  const client = sessions.find(sess => sess.id == data.id)?.client;
  client.destroy();
  client.initialize();

  // Menghapus pada file sessions
  const savedSessions = getSessionsFile();
  const sessionIndex = savedSessions.findIndex(sess => sess.id == data.id);
  savedSessions.splice(sessionIndex, 1);
  setSessionsFile(savedSessions);

  //io.emit('remove-session', data.id);
}




init();


// Socket IO
io.on('connection', function (socket) {

  init(socket);

  socket.on('create-session', function (data) {

    const savedSessions = getSessionsFile();

    const sessionIndex = savedSessions.findIndex(sess => sess.id == data.id);

    if (sessionIndex == -1) {
      createSession(data.id);


    } else {
      if (savedSessions[sessionIndex].ready == false)
        createSession(data.id);


    }
  });


  // socket.on('reset', function (data) {
  //   reset(data)
  // })

  socket.on('close', function (data) {
    close(data);
  })
  socket.on('reset', function (data) {
    const client = sessions.find(sess => sess.id == data.id)?.client;

    // Make sure the sender is exists & ready
    if (client) {
      client.distroy;
      client.initialize();
    }
  })

});

async function subscriptionValid(id) {
  return new Promise((resolve, reject) => {
    axios.get(ApiServer+"client/get?id="+id).then(res => {
      var period = res.data.data;

      if (new Date(period.expDate) >= new Date())
        resolve(true);
      else
        reject("Subscription Expired");
    }).catch(err => { reject(err) })
  });

}

// Send message
app.post('/send-message', async (req, res) => {
  console.log(req);
  try {

    const sender = req.body.sender;
    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;

    await subscriptionValid(sender).then(data => {
      const client = sessions.find(sess => sess.id == sender)?.client;

      // Make sure the sender is exists & ready
      if (!client) {
        return res.status(422).json({
          status: false,
          // message: `The sender: ${sender} is not found!`
        })
      }

      /**
       * Check if the number is already registered
       * Copied from app.js
       * 
       * Please check app.js for more validations example
       * You can add the same here!
       */
      // const isRegisteredNumber = await client.isRegisteredUser(number);

      // if (!isRegisteredNumber) {
      //   return res.status(422).json({
      //     status: false,
      //     message: 'The number is not registered'
      //   });
      // }

      client.sendMessage(number, message).then(response => {
        res.status(200).json({
          status: true,
          response: response
        });
      }).catch(err => {
        res.status(500).json({
          status: false,
          response: err
        });
      });
    }).catch(err)
    {
      res.status(500).json({
        status: false,
        response: err
      });
    }
  }

  catch (err) {

    res.status(500).json({
      status: false,
      response: err
    });
  }
});


// Send media
app.post('/send-fileurlmedia', async (req, res) => {
  try {
    const sender = req.body.sender;
    const number = phoneNumberFormatter(req.body.number);
    const caption = req.body.caption;
    const fileUrl = req.body.fileurl;

    // const media = MessageMedia.fromFilePath('./image-example.png');
    // const file = req.files.file;
    // const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);


    await subscriptionValid(sender).then(async data => {
      const client = sessions.find(sess => sess.id == sender)?.client;

      if (!client) {
        return res.status(422).json({
          status: false,
          // message: `The sender: ${sender} is not found!`
        })
      }


      let mimetype;
      const attachment = await axios.get(fileUrl, {
        responseType: 'arraybuffer'
      }).then(response => {
        mimetype = response.headers['content-type'];
        return response.data.toString('base64');
      });

      const media = new MessageMedia(mimetype, attachment, 'Media');

      client.sendMessage(number, media, {
        caption: caption
      }).then(response => {
        res.status(200).json({
          status: true,
          response: response
        });
      }).catch(err => {
        res.status(500).json({
          status: false,
          response: err
        });
      });
    }).catch(err => {

      res.status(500).json({
        status: false,
        response: err
      });

    })
  }

  catch (err) {
    res.status(500).json({
      status: false,
      response: err
    });
  }
});

// Send media
app.post('/send-media', async (req, res) => {
  try {

    const sender = req.body.sender;
    const number = phoneNumberFormatter(req.body.number);
    const caption = req.body.caption;
    const file = req.files.file;


    await subscriptionValid(sender).then(async data => {
      const client = sessions.find(sess => sess.id == sender)?.client;

      if (!client) {
        return res.status(422).json({
          status: false,
          // message: `The sender: ${sender} is not found!`
        })
      }


      const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);

      client.sendMessage(number, media, {
        caption: caption
      }).then(response => {
        res.status(200).json({
          status: true,
          response: response
        });
      }).catch(err => {
        res.status(500).json({
          status: false,
          response: err
        });
      });
    }
    ).catch(err=>{
      res.status(500).json({
        status: false,
        response: err
      });


    })
  }


  catch (err) {
    res.status(500).json({
      status: false,
      response: err
    });

  }
});

app.post('/send-base64media', async (req, res) => {
  try {
    const sender = req.body.sender;
    const number = phoneNumberFormatter(req.body.number);
    const caption = req.body.caption;
    const base64 = req.body.base64;
    const mimetype = req.body.mimetype;
    const filename = req.body.filename;
    var pos = -1;
    // var aa=  subscriptionValid(sender)


    await subscriptionValid(sender).then(data => {
      const client = sessions.find(sess => sess.id == sender)?.client;

      if (!client) {
        return res.status(422).json({
          status: false,
          // message: `The sender: ${sender} is not found!`
        })
      }

      const mimes = getMimeiFile();
      if (mimetype) {
        pos = mimes.findIndex(sess => sess.typ == mimetype);

      }
      else {
        const ary = filename.split(".")
        if (ary.length >= 1) {
          const ext1 = ary[ary.length - 1];

          pos = mimes.findIndex(exts => exts.ext == ext1);
        }

      }

      if (pos >= 0) {
        // const media = MessageMedia.fromFilePath('./image-example.png');
        // const file = req.files.file;
        const base64ary = base64.split(",");
        var base64string = base64ary[base64ary.length - 1];

        const media = new MessageMedia(mimes[pos].typ, base64string, filename);

        client.sendMessage(number, media, {
          caption: caption
        }).then(response => {
          res.status(200).json({
            status: true,
            response: response
          });
        }).catch(err => {
          res.status(500).json({
            status: false,
            response: err
          });
        });
      }
      else {
        res.status(500).json({
          status: false,
          response: "Incorrect mimetype"
        });
      }
    }).catch(err => {
      res.status(500).json({
        status: false,
        response: err
      });
    });
  }

  catch (err) {
    res.status(500).json({
      status: false,
      response: err
    });
  }
});

app.post('/client-Info', async (req, res) => {
  const client = sessions.find(sess => sess.id == req.body.sender)?.client;
  if (client) {
    if (client.info) {

      client.getState().then(waStatus => {

        res.status(200).json({
          status: true,
          response: {
            info: client.info,
            status: client.status,
            waStatus: waStatus,

          }
        });
      });
    }
    else {
      res.status(422).json({
        status: false,
        message: 'Disconnected'
      });
    }
  }

  else {
    res.status(422).json({
      status: false,
      message: 'Disconnected'
    });
  }

});

server.listen(port, function () {
  console.log('App running on *: ' + port);
});
