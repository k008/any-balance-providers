﻿var g_headers = {
	'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
	'Accept-Language':'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
	'User-Agent':'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
};

function main() {
	var prefs = AnyBalance.getPreferences();
	AnyBalance.setDefaultCharset('utf-8');
	checkEmpty(prefs.wallet, 'Введите wallet address!');
	checkEmpty(prefs.worker, 'Введите worker name!');
	
	var baseurl = 'https://api-zcash.flypool.org/';
	
	var html = AnyBalance.requestGet(baseurl + 'miner/' + prefs.wallet + '/workers', g_headers);
	if (!html || AnyBalance.getLastStatusCode() > 400) {
		AnyBalance.trace(html);
		throw new AnyBalance.Error('Ошибка при подключении к сайту провайдера! Возможно сайт изменился.');
	}
	
	var json = getJson(html);
		if (json.status != 'OK') {
		var error = json.error;
		if (error)
			throw new AnyBalance.Error(error, null, /Invalid address/i.test(error));
		
		AnyBalance.trace(html);
		throw new AnyBalance.Error('Не удалось найти данный адрес кошелька');
	}
	
	var fw = json.data.find(function(el){
		if (el.worker === prefs.worker) {
			return el.worker === prefs.worker;
		} else 
			throw new AnyBalance.Error('Не удалось найти воркера');
	});
	
	var hr = fw ? fw['currentHashrate'] : null;
	
	html = AnyBalance.requestGet(baseurl + 'miner/' + prefs.wallet + '/currentStats', g_headers);
	AnyBalance.trace(html);
	var json = getJson(html);
	if (json.data !=null && json.data !== 'NO DATA'){
		var aw = json.data.activeWorkers;	
		var up = json.data.unpaid;
		var uc = json.data.unconfirmed;
		var hrg = json.data.currentHashrate;
	}
	else 
		throw new AnyBalance.Error('Не удалось найти данные, проверьте wallet address');

	var result = { success: true };
	getParam(hr, result, 'hashrateWorker', null, null, parseBalance2);
	getParam(hrg, result, 'hashrateGeneral', null, null, parseBalance2);
	getParam(aw, result, 'activeworker');
	getParam(up, result, 'up', null, null, parseUPandUC);
	getParam(uc, result, 'uc', null, null, parseUPandUC);
	
	getParam(prefs.worker, result, '__tariff');
    AnyBalance.setResult(result);
}
function parseBalance2(str) {
  var val = parseBalance(str);
  if (isset(val))
    val = Math.round(val) / 1000;
  return val;
}
function parseUPandUC(str) {
  var val = parseBalance(str);
  if (isset(val))
    val = Math.round(val /1000) / (10*10000);
  return val;
}