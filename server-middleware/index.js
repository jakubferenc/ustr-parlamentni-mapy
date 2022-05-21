import express from 'express';
import axios from "axios";
import {writeFileSync, readFileSync} from "fs";
import { dirname } from 'path';

import path from 'path';

import projectConfig from '../project.config';
import apiFactory from '../factories';
import { normalizeSouborAttrs, getCasovaOsaDataForPoslanec, getAdresyProMapuForPoslanec } from '../utils/functions';

const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());



app.get('/api/snemovni-obdobi/', async (req, res) => {


  const snemovniObdobiWordpressArrRes = await apiFactory.getAllSnemovniObdobiWordpressFactory(projectConfig.wordpressAPIURLWebsite, projectConfig.databazePoslancuURL);
  // const pathToWrite = path.join(__dirname, '..', 'data/snemovni-obdobi.json');
  // writeFileSync(pathToWrite, JSON.stringify(snemovniObdobiWordpressArrRes));

  const snemovniObdobiWordpressArrResDatabaseIds = snemovniObdobiWordpressArrRes.map(item => item.databaze_id);

  const snemovniObdobiObjs = await Promise.all(snemovniObdobiWordpressArrResDatabaseIds.map(async (snemovniObdobiId) => {

    const snemovniObdobiObj = await apiFactory.getSnemovniObdobiDetailFactory(projectConfig.wordpressAPIURLWebsite, projectConfig.databazePoslancuURL, snemovniObdobiId);

    return snemovniObdobiObj;


  }));

  const pathToWrite = path.join(__dirname, '..', 'data/snemovni-obdobi.json');
  writeFileSync(pathToWrite, JSON.stringify(snemovniObdobiObjs));

  res.send(snemovniObdobiObjs);

});

app.get('/api/test/', async (req,res) => {

  // const strankyRes = await apiFactory.getAllStrankyFactory(projectConfig.wordpressAPIURLWebsite);

  try {

    const filtrNastaveniParamsString = '?Poslanec=True&Limit=100&Stranka=1&VekNaZacatkuMandatuMin=0&VekNaZacatkuMandatuMax=20';

    let poslanciRequest = await axios.get(`${projectConfig.databazePoslancuURL}/Api/osoby/${filtrNastaveniParamsString}`);
    poslanciRequest = poslanciRequest.data;

    const poslanci = poslanciRequest.Poslanci;
    const filterData = poslanciRequest.Filtry;

    const idsOnly = poslanci.map(item => item.Id);

    res.send(idsOnly);


  } catch (err) {
    console.warn(err);
  }

  // const mediaRes =  await apiFactory.getAllMediaFactory(projectConfig.wordpressAPIURLWebsite, projectConfig.databazePoslancuURL, 100);
  // const pathToWriteMedia = path.join(__dirname, '..', 'data/media.json');
  // writeFileSync(pathToWriteMedia, JSON.stringify(mediaRes));


});


app.get('/api/stranky/', async (req,res) => {

  // const strankyRes = await apiFactory.getAllStrankyFactory(projectConfig.wordpressAPIURLWebsite);

  const strankyRes = await apiFactory.getAllStrankyFactory(projectConfig.wordpressAPIURLWebsite);
  const pathToWriteStranky = path.join(__dirname, '..', 'data/stranky.json');
  writeFileSync(pathToWriteStranky, JSON.stringify(strankyRes));

  // const mediaRes =  await apiFactory.getAllMediaFactory(projectConfig.wordpressAPIURLWebsite, projectConfig.databazePoslancuURL, 100);
  // const pathToWriteMedia = path.join(__dirname, '..', 'data/media.json');
  // writeFileSync(pathToWriteMedia, JSON.stringify(mediaRes));

  res.send(strankyRes);

});

app.get('/api/poslanec/:poslanecId/', async (req,res) => {

  const params = req.params;

  const poslanec = await apiFactory.getPoslanecDetailFactory(projectConfig.databazePoslancuURL, params.poslanecId);

  res.send(poslanec);//
  res.send("hello");

});

app.get('/data/poslanec/:poslanecId/', async (req, res) => {


  const readPoslanci = path.join(__dirname, '..', 'data/osoby.json');

  const data = readFileSync(readPoslanci, {encoding:'utf8', flag:'r'});

  const dataJson = JSON.parse(data);

  const items = dataJson.filter(item => item.Id == req.params.poslanecId);

  let poslanec = items[0];

  // prepare data for casova osa
  poslanec.CasovaOsa = getCasovaOsaDataForPoslanec(poslanec);

  poslanec.AdresyProMapu = getAdresyProMapuForPoslanec(poslanec);


  res.send(poslanec);

});

app.get('/data/parlamenty/', async (req,res) => {

  const readParlamenty = path.join(__dirname, '..', 'data/parlamenty.json');

  const data = readFileSync(readParlamenty, {encoding:'utf8', flag:'r'});

  const dataJson = JSON.parse(data);

  const items = dataJson;

  res.send(items);

});

app.get('/data/osoby-s-fotkou/', async (req,res) => {

  const pathToReadOsoby = path.join(__dirname, '..', 'data/osoby.json');

  const data = readFileSync(pathToReadOsoby, {encoding:'utf8', flag:'r'});

  const dataJson = JSON.parse(data);

  const itemsWithFiles = dataJson.filter(item => item.Soubory.length && item.Soubory.length > 0).map(item => item.Id);

  res.send(itemsWithFiles);

});

app.get('/api/osoby/', async(req, res) => {

  const osobyRes = await axios.get(`${projectConfig.databazePoslancuURL}/Api/osoby/?Limit=10&`);
  const osobyData = osobyRes.data;

  res.send(osobyData);


});

app.get('/api/osoby-vsechny/', async (req,res) => {


  const osobyRes = await axios.get(`${projectConfig.databazePoslancuURL}/Api/osoby/vsechny-osoby`);
  const osobyData = osobyRes.data;
  const pathToWriteOsoby = path.join(__dirname, '..', 'data/osoby.json');
  writeFileSync(pathToWriteOsoby, JSON.stringify(osobyData));

  res.send('osoby loaded ok!');

});

app.get('/api/parlamenty/', async (req,res) => {



  const parlamenty = await apiFactory.getParlamentyDatabazeFactory(projectConfig.databazePoslancuURL);

  let parlamentyWPData = await axios.get( `${projectConfig.wordpressAPIURLWebsite}/wp/v2/parlamentni_telesa?per_page=100`);
  parlamentyWPData = parlamentyWPData.data;

  const parlamentyRes = await Promise.all(parlamenty.map(async (parlament) => {

    const getSnemovniObdobi = await axios.get(`${projectConfig.databazePoslancuURL}/Api/snemovny/${parlament.Id}`);
    parlament.SnemovniObdobi = getSnemovniObdobi.data.SnemovniObdobi;



    // get wordpress content referenced via Id
    let thisWPParlamentObj = parlamentyWPData.filter((item) => item.databaze_id == parlament.Id);



    // checking potential errors
    if (!thisWPParlamentObj.length) {
      throw new Error(`There is not Wordpress Parlament object matching the id from the main database. Parlament.Id is: ${parlament.Id}. 'Parlament name is: ${parlament.Nazev}`);
      return;
    }

    if (thisWPParlamentObj.length > 1) {
      throw new Error(`There are more than one Wordpress Parlament objects matching the id from the main database. Parlament.Id is: ${parlament.Id}. 'Parlament name is: ${parlament.Nazev}`);
      return;
    }


    thisWPParlamentObj = thisWPParlamentObj[0];
    parlament.Popis = thisWPParlamentObj.content.rendered;
    parlament.WPNazev = thisWPParlamentObj.title.rendered;
    parlament.StrucnyPopis = thisWPParlamentObj.excerpt.rendered;

    parlament.Barva = thisWPParlamentObj.barva;

    if (thisWPParlamentObj.acf?.casova_osa) {
      parlament.CasovaOsa = thisWPParlamentObj.acf.casova_osa;

      // sort by date
      parlament.CasovaOsa.sort();

      const beginningOfParlamentObj = {
        "datum_udalosti": parlament.SnemovniObdobi[0].DatumZacatku.split('T')[0],
        "nazev_udalosti": "Začátek parlamentního tělesa",
        "dulezita": [
        "true"
        ],
        "typUdalosti": ['datumZacatekParlamentu'],
      };

      const endOfParlamentObj = {
        "datum_udalosti": parlament.SnemovniObdobi[parlament.SnemovniObdobi.length-1].DatumKonce.split('T')[0],
        "nazev_udalosti": "Konec parlamentního tělesa",
        "dulezita": [
        "true"
        ],
        "typUdalosti": ['datumKonecParlamentu'],
      };

      parlament.CasovaOsa = [beginningOfParlamentObj, ...parlament.CasovaOsa, endOfParlamentObj];


    }

    if (thisWPParlamentObj.acf?.galerie) {

      parlament.Galerie = thisWPParlamentObj.acf.galerie.map(item => {

        return normalizeSouborAttrs(item);

      });

    }


    return parlament;

  }));


  const pathToWrite = path.resolve(__dirname, '..', 'data/parlamenty.json');

  writeFileSync(pathToWrite, JSON.stringify(parlamentyRes));

  res.send(parlamentyRes);

});

app.get('/api/media/', async (req,res) => {


  const mediaRes =  await apiFactory.getAllMediaFactory(projectConfig.wordpressAPIURLWebsite, projectConfig.databazePoslancuURL, 100);
  const pathToWriteMedia = path.join(__dirname, '..', 'data/media.json');
  writeFileSync(pathToWriteMedia, JSON.stringify(mediaRes));

  res.send(mediaRes);

});

app.get('/get/slovnik/', async (req,res) => {


  const slovnikRes =  await apiFactory.getSlovnikovaHeslaFactory(projectConfig.wordpressAPIURLWebsite);
  const pathToWriteSlovnik = path.join(__dirname, '..', 'data/slovnik.json');
  writeFileSync(pathToWriteSlovnik, JSON.stringify(slovnikRes));

  res.send(slovnikRes);

});

app.get('/api/socialni-mapy/', async (req,res) => {


  const rodinyRes = await apiFactory.getRodinySocialniMapyFactory(projectConfig.wordpressAPIURLWebsite, projectConfig.databazePoslancuURL);
  // const pathToWrite = path.join(__dirname, '..', 'data/rodiny.json');
  // writeFileSync(pathToWrite, JSON.stringify(rodinyRes));

  res.send(rodinyRes);

});

app.get('/api/casova-osa/', async (req,res) => {


  const casovaOsaRes = await apiFactory.getCasovaOsaFactory(projectConfig.wordpressAPIURLWebsite);
  const pathToWrite = path.join(__dirname, '..', 'data/casova-osa.json');
  writeFileSync(pathToWrite, JSON.stringify(casovaOsaRes));

  res.send(casovaOsaRes);

});

export default app;
