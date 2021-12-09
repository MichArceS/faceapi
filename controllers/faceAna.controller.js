const https = require('https');
var http = require('http');
var fs = require('file-system');
var path = require('path');
const csv = require('csv-parser');

const options = {
    hostname: 'f28f20e9251b.ngrok.io',
    path: '/api/v1/entrance/AlmacenarResultadosFaciales',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
}

//Distancias a Comparar
var distancia_Sorpresa_1 = 0;
var distancia_Sorpresa_2 = 0;
var jsonArray = [];

exports.recieveVideo = async function (req, res, next) {
    console.log(req.file);

    var newNames = req.file.originalname;
    var oldpath = req.file.path;
    var newpath = path.join(__dirname, '../uploads') + '\\' + newNames;

    fs.rename(oldpath, newpath, function (err) {
        if (err) throw err;
        res.write('File uploaded and moved!');
        res.end();
    });

    //Utilizar OpenFace para analizar la imagen o vídeo ingresado
    var child = null;
    const {
        spawn
    } = require("child_process")
    if (newNames.includes(".jpg")) {
        let exe = path.join(__dirname, '../OpenFace') + "\\FaceLandmarkImg.exe";
        child = spawn(exe, ["-f",
            newpath
        ])
    } else {
        let exe = path.join(__dirname, '../OpenFace') + "\\FeatureExtraction.exe";
        child = spawn(exe, ["-f",
            newpath
        ])
    }
    child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    child.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        let routeRead = path.join(__dirname, '../processed/')
        console.log(newNames)
        fs.createReadStream(routeRead + newNames.split('.')[0] + '.csv')
            .pipe(csv())
            .on('data', (row) => {
                // ** Análisis de los datos del registro ** //
                //Lectura exitosa
                let success = parseInt(`${row[" success"]}.`, 10);
                if (success == 1) {
                    //Datos del juego
                    let jugador = newNames[0];
                    let escenario = newNames[1];
                    let escuela = newNames[2];
                    let juego = parseInt(newNames[3], 10);

                    let frame = parseInt(`${row["frame"]}.`, 10);
                    let timestamp = parseFloat(`${row[" timestamp"]}.`);
                    let confidence = parseFloat(`${row[" confidence"]}.`);
                    let poseRx = parseFloat(`${row[" pose_Rx"]}.`) * (180 / Math.PI);
                    let poseRy = parseFloat(`${row[" pose_Ry"]}.`) * (180 / Math.PI);
                    let poseRz = parseFloat(`${row[" pose_Rz"]}.`) * (180 / Math.PI);
                    let gazeAngleX = parseFloat(`${row[" gaze_angle_x"]}.`) * (180 / Math.PI);
                    let gazeAngleY = parseFloat(`${row[" gaze_angle_y"]}.`) * (180 / Math.PI);


                    //Puntos faciales
                    let x21 = parseFloat(`${row[" x_21"]}.`);
                    let x22 = parseFloat(`${row[" x_22"]}.`);
                    let x39 = parseFloat(`${row[" x_39"]}.`);
                    let x42 = parseFloat(`${row[" x_42"]}.`);
                    let x61 = parseFloat(`${row[" x_61"]}.`);
                    let x62 = parseFloat(`${row[" x_62"]}.`);
                    let x63 = parseFloat(`${row[" x_63"]}.`);
                    let x65 = parseFloat(`${row[" x_65"]}.`);
                    let x66 = parseFloat(`${row[" x_66"]}.`);
                    let x67 = parseFloat(`${row[" x_67"]}.`);

                    let y4 = parseFloat(`${row[" y_4"]}.`);
                    let y12 = parseFloat(`${row[" y_12"]}.`);
                    let y17 = parseFloat(`${row[" y_17"]}.`);
                    let y18 = parseFloat(`${row[" y_18"]}.`);
                    let y21 = parseFloat(`${row[" y_21"]}.`);
                    let y22 = parseFloat(`${row[" y_22"]}.`);
                    let y25 = parseFloat(`${row[" y_25"]}.`);
                    let y26 = parseFloat(`${row[" y_26"]}.`);
                    let y39 = parseFloat(`${row[" y_39"]}.`);
                    let y42 = parseFloat(`${row[" y_42"]}.`);
                    let y48 = parseFloat(`${row[" y_48"]}.`);
                    let y49 = parseFloat(`${row[" y_49"]}.`);
                    let y53 = parseFloat(`${row[" y_53"]}.`);
                    let y54 = parseFloat(`${row[" y_54"]}.`);
                    let y55 = parseFloat(`${row[" y_55"]}.`);
                    let y57 = parseFloat(`${row[" y_57"]}.`);
                    let y59 = parseFloat(`${row[" y_59"]}.`);
                    let y61 = parseFloat(`${row[" y_61"]}.`);
                    let y62 = parseFloat(`${row[" y_62"]}.`);
                    let y63 = parseFloat(`${row[" y_63"]}.`);
                    let y65 = parseFloat(`${row[" y_65"]}.`);
                    let y66 = parseFloat(`${row[" y_66"]}.`);
                    let y67 = parseFloat(`${row[" y_67"]}.`);

                    //Empatía
                    let emocion = "No definido";
                    let sorpresa = 0;
                    let neutral = 0;
                    let felicidad = 0;
                    let desinteres = 0;
                    let tristeza = 0;
                    let enojo = 0;

                    //Sorpresa
                    let distancia21_39 = distancia(x21, y21, x39, y39);
                    let distancia22_42 = distancia(x22, y22, x42, y42);
                    if (distancia21_39 > distancia_Sorpresa_1 && distancia22_42 > distancia_Sorpresa_2) {
                        sorpresa = 1;
                    }
                    distancia_Sorpresa_1 = distancia21_39;
                    distancia_Sorpresa_2 = distancia22_42;

                    //Neutral
                    let altura17_18 = y17 >= y18;
                    let altura26_25 = y26 >= y25;
                    if (altura17_18 && altura26_25) {
                        neutral = 1;
                    }

                    //Felicidad
                    let altura48_61 = y48 <= y61;
                    let altura54_63 = y54 <= y63;

                    if (altura48_61 && altura54_63) {
                        felicidad = 1;
                    }

                    //Tristeza
                    let altura48_67 = y48 >= y67;
                    let altura54_65 = y54 >= y65;
                    if (altura48_67 && altura54_65) {
                        tristeza = 1;
                    }

                    //Enojo
                    let altura21_17 = y21 >= y17;
                    let altura22_26 = y22 >= y26;
                    if (altura21_17 && altura22_26) {
                        enojo = 1;
                    }

                    //Posición de la cabeza
                    let c_perpendicular = 0;
                    let c_inc_abajo = 0;
                    let posic_cabeza = "No definido";

                    if ((poseRx >= -57.3 && poseRx < 20.05) && (poseRy > -57.3 && poseRy < 57.3) && (poseRz > -57.3 && poseRz < 57.3)) {
                        c_perpendicular = 1;
                        posic_cabeza = "perpendicular";
                        perpen++;
                        totCab++;
                    }

                    if ((poseRx > 20.05 && poseRx < 114.59) && (poseRy > -57.3 && poseRy < 57.3) && (poseRz > -57.3 && poseRz < 57.3)) {
                        c_inc_abajo = 1;
                        posic_cabeza = "inclinada";
                        incli++;
                        totCab++;
                    }

                    //Mirada del ojo
                    let atenc_rostro = 0;
                    let atenc_busto = 0;
                    let atenc_tablet = 0;
                    let atenc_general = 0;
                    let atenc_loly = 0;
                    let atencion = "Indeterminado"

                    //Atención rostro
                    if ((gazeAngleX > -42.97 && gazeAngleX < 42.97) && (gazeAngleY > -42.97 && gazeAngleY < 5.73) && c_perpendicular == 1) {
                        atenc_rostro = 1;
                        atencion = "Rostro robotico"
                        generalLolyRostro++;
                        totGeneral++;
                    }


                    //Atención busto
                    if ((gazeAngleX > -42.97 && gazeAngleX < 42.97) && (gazeAngleY > 5.73 && gazeAngleY < 14.32) && c_perpendicular == 1) {
                        atenc_busto = 1;
                        atencion = "Busto robotico"
                        generalLolyBusto++;
                        totGeneral++;
                    }

                    //Atención tablet
                    if (((gazeAngleX > -42.97 && gazeAngleX < 42.97) && (gazeAngleY > 14.32 && gazeAngleY < 42.97)) || c_inc_abajo == 1) {
                        atenc_tablet = 1;
                        atencion = "Tablet"
                        tabletSi++;
                        generalTablet++;
                        totGeneral++;
                        totTablet++;
                    }
                    else {
                        tabletNo++;
                        totTablet++;
                    }

                    //Atención loly
                    if (atenc_rostro == 1 || atenc_busto == 1) {
                        atenc_loly = 1;
                        lolySi++;
                        totLol++;
                    }
                    else {
                        lolyNo++;
                        totLol++;
                    }

                    //Atención General
                    if (atenc_rostro == 1 || atenc_busto == 1 || atenc_tablet == 1 || c_perpendicular == 1 || c_inc_abajo == 1) {
                        atenc_general = 1;
                    }
                    else {
                        generalNada++;
                        totGeneral++;
                        atencion = "No atento"
                    }

                    //Desinteres
                    if (atenc_general == 0) {
                        desinteres = 1;
                    }

                    if (neutral == 1) emocion = "neutral"
                    if (enojo == 1) emocion = "enojo"
                    if (sorpresa == 1) emocion = "sorpresa"
                    if (felicidad == 1) emocion = "felicidad"
                    if (tristeza == 1) emocion = "tristeza"
                    if (desinteres == 1) emocion = "desinteres"

                    if (emocion.localeCompare("neutral") == 0) {
                        neu++;
                        totEmo++;
                    }
                    if (emocion.localeCompare("enojo") == 0) {
                        eno++;
                        totEmo++;
                    }
                    if (emocion.localeCompare("sorpresa") == 0) {
                        sor++;
                        totEmo++;
                    }
                    if (emocion.localeCompare("felicidad") == 0) {
                        fel++;
                        totEmo++;
                    }
                    if (emocion.localeCompare("tristeza") == 0) {
                        tri++;
                        totEmo++;
                    }
                    if (emocion.localeCompare("desinteres") == 0) {
                        des++;
                        totEmo++;
                    }
                    //Resultados finales
                    /*console.log("jugador|sorpresa|neutral|felicidad|desinteres_enojo|tristeza|atenc_general|atenc_rostro|atenc_busto|atenc_tablet");

                    console.log(jugador + "|" + sorpresa + "|" + neutral + "|" + felicidad + "|" + desinteres_enojo
                     + "|" + tristeza + "|" + atenc_general + "|" + atenc_rostro + "|" + atenc_busto
                     + "|" + atenc_tablet);*/

                    var json = {
                        Frame: frame, //Int
                        timestamp: timestamp, //Float
                        confidence: confidence, //Float
                        Jugador: jugador, //String
                        Juego: juego, //Int
                        Escenario: escenario, //String
                        Escuela: escuela, //String
                        Success: success, //Int
                        Emocion: emocion, //String
                        Sorpresa: sorpresa, //Int
                        Neutral: neutral, //Int
                        Felicidad: felicidad, //Int
                        Desinteres: desinteres, //Int
                        Enojo: enojo, //Int
                        Tristeza: tristeza, //Int
                        posic_cabeza: posic_cabeza, //String
                        c_perpendicular: c_perpendicular, //Int
                        c_inc_abajo: c_inc_abajo, //Int
                        Atencion: atencion, //String
                        atenc_general: atenc_general, //Int
                        atenc_loly: atenc_loly, //Int
                        atenc_rostro: atenc_rostro, //Int
                        atenc_busto: atenc_busto, //Int
                        atenc_tablet: atenc_tablet //Int
                    };

                    jsonArray.push(json);
                }
            })
            //Final del análisis
            .on('end', () => {
                console.log('CSV file successfully processed');
                var data = JSON.stringify(jsonArray);

                const req = https.request(options, res => {
                    console.log(`statusCode: ${res.statusCode}`)
                    res.on('data', d => {
                        process.stdout.write(d)
                    })
                })

                req.on('error', error => {
                    console.error(error)
                })
                req.write(data)
                req.end()
            });
    });
    res.status(200)
}