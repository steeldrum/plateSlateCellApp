/***************************************
$Revision:: 175                        $: Revision of last commit
$LastChangedBy::                       $: Author of last commit
$LastChangedDate:: 2012-01-03 14:44:48#$: Date of last commit
***************************************/


//global arrays
var portions = new Array();
var plates = new Array();
var slates = new Array();
var slateOffsetThreshold = 100;
var isPlateMasterDataInserted = 0;

// tjs 120216
var portionNames = new Array();

//global set as side effect for random choice of a plate
var plateSelectionsHtml;
var plateGrainsHtml;
var plateProteinHtml;
var plateVegetablesHtml;
var plateFruitsHtml;
var plateDairyHtml;
var selectedBreakfastPlate;
var selectedLunchPlate;
var selectedDinnerPlate;

var plateSelectionRandom = true;
var plateSelectionSeasonal = true;
var plateSelectionShared = false;
var plateSelectionReport = 'slate';
// tjs 120103 additional preferences
//TODO
//open page with bfast|lunch|dinner pref
//pref - setting reset would re-activitate inactibe plates
var slateMealPlansForDinnerOnly = false;
// tjs 120209 additional preferences
var refreshDataFromServerDefault = false;
var backupDataToServer = false;

var preferences = {
	plateSelectionRandom: true,
	plateSelectionSeasonal: true,
	plateSelectionShared: false,
	slateMealPlansForDinnerOnly: false,
	refreshDataFromServerDefault: false,
	backupDataToServer: false
};

var loginInfo = {
	id: 0,
	userName: 'unknown',
	firstName: 'firstName',
	lastName: 'lastName'
};

var weekday=new Array(7);
weekday[0]="Sunday";
weekday[1]="Monday";
weekday[2]="Tuesday";
weekday[3]="Wednesday";
weekday[4]="Thursday";
weekday[5]="Friday";
weekday[6]="Saturday";

// tjs 120113
var screenReportFontColors = new Array(10);
screenReportFontColors[0] = 0;
screenReportFontColors[1] = 20;
screenReportFontColors[2] = 40;
screenReportFontColors[3] = 60;
screenReportFontColors[4] = 80;
screenReportFontColors[5] = 100;
screenReportFontColors[6] = 120;
screenReportFontColors[7] = 140;
screenReportFontColors[8] = 160;
screenReportFontColors[9] = 180;

// tjs 120216
var debugLoopCount = 0;

// tjs 120221
var importProfile = false;

var systemDB;

function Portion(id, type, name, description, master, isInactive) {
	this.id = id;
	this.type = type;
	this.name = name;
	this.description = description;
	this.master = master;
	this.isInactive = isInactive;
}

function Plate(id, type, name, description, master, portion1, portion2, portion3, portion4, portion5, portion6, portion7, portion8, portion9, isInactive) {
	this.id = id;
	this.type = type;
	this.name = name;
	this.description = description;
	this.master = master;
	this.portion1 = portion1;
	this.portion2 = portion2;
	this.portion3 = portion3;
	this.portion4 = portion4;
	this.portion5 = portion5;
	this.portion6 = portion6;
	this.portion7 = portion7;
	this.portion8 = portion8;
	this.portion9 = portion9;
	this.isInactive = isInactive;
}

function Slate(id, offset, date, name, description, breakfastId, lunchId, dinnerId, breakfastPortions, lunchPortions, dinnerPortions, isInactive) {
	this.id = id;
	this.offset = offset;
	this.date = date;
	this.time = Date.parse(date);
	this.name = name;
	this.description = description;
	this.breakfastId = breakfastId;
	this.lunchId = lunchId;
	this.dinnerId = dinnerId;
	if (breakfastPortions != null)
		this.breakfastPortions = breakfastPortions;
	else
		this.breakfastPortions = new Array();
	if (lunchPortions != null)
		this.lunchPortions = lunchPortions;
	else
		this.lunchPortions = new Array();
	if (dinnerPortions != null)
		this.dinnerPortions = dinnerPortions;
	else
		this.dinnerPortions = new Array();
	this.isInactive = isInactive;
}

function initDB() {	 
	try {
	    if (!window.openDatabase) {
	        alert('not supported');
	    } else {
	    	var datab;
	    	var shortName = 'plateSlate';
	    	var version = '1.0';
	    	var displayName = 'plateSlate';
	    	var maxSize = 200000;
	    	datab = openDatabase(shortName, version, displayName, maxSize);
	 	        // You should have a database instance in datab.	 
	    }
	} catch(e) {
	    // Error handling code goes here.
	    if (e == INVALID_STATE_ERR) {
	        // Version number mismatch.
	    alert("Invalid database version.");

	    } else {
	    alert("Unknown error "+e+".");

	    }
	    return;
	}
	createTables(datab);
	systemDB = datab;
}

/*! This creates the database tables. */
function createTables(db) {
/* To wipe out the table (if you are still experimenting with schemas,
   for example), enable this block. */
	if (0) {
    db.transaction(
        function (transaction) {
        transaction.executeSql('DROP TABLE portion;');
        transaction.executeSql('DROP TABLE plate;');
        transaction.executeSql('DROP TABLE slate;');
        transaction.executeSql('DROP TABLE food;');
        }
    );
}

db.transaction(
    function (transaction) {

			transaction.executeSql(
			'CREATE TABLE  IF NOT EXISTS portion ' +
			' (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
			' type varchar(16), name varchar(32),  description varchar(100), master integer, isInactive integer );'
			);

			transaction.executeSql(
					'CREATE TABLE  IF NOT EXISTS plate ' +
					' (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
					' type varchar(16), name varchar(32),  description varchar(100), master integer, portion1 integer, portion2 integer, portion3 integer, portion4 integer, portion5 integer, portion6 integer, portion7 integer, portion8 integer, portion9 integer, isInactive integer );'
					);

			transaction.executeSql(
					'CREATE TABLE  IF NOT EXISTS slate ' +
					' (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
					' date varchar(16), name varchar(32),  description varchar(100), breakfast integer, lunch integer, dinner integer, isInactive integer );'
					);

			transaction.executeSql(
					'CREATE TABLE  IF NOT EXISTS food ' +
					' (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
					' slate integer, type varchar(16), portion integer, master integer, isInactive integer);'
					);

    } // end function(transaction)
); // end datab.transaction

}


function readPortions()
{	
	initDB();
	loadPreferences();
	
	//ensure tables are populated with master data...
	//when fully populated database then loads local cache array portions[]
	// tjs 120210
	loadPortions(true, null);
}

// tjs 120211
//function loadPortions(isStatic)
function loadPortions(isStatic, xml)
{
/*	
	var datab;var shortName = 'plateSlate';
	var version = '1.0';
	var displayName = 'plateSlate';
	var maxSize = 200000;
	datab = openDatabase(shortName, version, displayName, maxSize);
*/
	var isPortionMasterDataInserted = false;
	var id;
	var type;
	var name;
	var description;
	var master;
	var isMaster;
	var isInactive;
	
	systemDB.transaction(
			function(transaction) {
				transaction.executeSql(
				'SELECT id, type, name,  description, master, isInactive FROM portion', null,
				
				function (transaction, result) {
					//alert("plateslate loadPortions result.rows.length " + result.rows.length);
					if (result.rows.length <=0) {
						isPortionMasterDataInserted = false;
						//alert("plateslate loadPortions isPortionMasterDataInserted " + isPortionMasterDataInserted);
						// tjs 120214
						if (isStatic == true) {
							populatePortion();
						} else { // wait for the transactions...
							setTimeout(function() {
								//alert('hello');
								loadPortions(isStatic, xml);
								},1250);
						}						
					} else {
						// tjs 120216
						if (isStatic == false) {
							portionNames.length = 0;
						}
						
						//alert("plateslate loadPortions result.rows.length " + result.rows.length);
						for (var i=0; i < result.rows.length; i++) {
							var row = result.rows.item(i);
							id=parseInt(row.id);
							type = row.type;
							name = row.name;
							description = row.description;
							master=parseInt(row.master);
							isInactive=parseInt(row.isInactive);
							var portion = new Portion(id, type, name, description, master, isInactive);
							//e.g. 48 test portions
							//alert("plateslate loadPortions for id " + id + " have portion name " + portion.name);
							portions[id] = portion;
							if (isStatic == false) {
								portionNames[name] = id;
							}
						}
						isPortionMasterDataInserted = true;
						//e.g. 49
						//alert("plateslate loadPortions isPortionMasterDataInserted " + isPortionMasterDataInserted + " portions length " + portions.length + " isStatic " + isStatic);
						//now that the dependent portions are stored in the database
						//and available in the cache array, portions[], load the plates that use portions...
						if (isStatic == true) {
							// tjs 120214
							//loadPlates(true);
							loadPlates(true, null);
						} else {
							// tjs 120211
							//alert("plateslate loadPortions xml length " + xml.length);
							// we are doing a restore from the server...
							// e.g. <dish type="Dinner" name="Pizza and Salad" description="BGE smoked" isMaster="0" isInactive="0">
					         //<segments><segment type="Grain" description="Irish Bread" isMaster="1" isInactive="0">Irish Bread</segment></segments>
								//var dishes = new Array();
								var dish;
								var index = 0;
								$(xml).find('dish').each(function() {
									var dish = $(this);
									type = dish.attr('type');
									name = dish.attr('name');
									description = dish.attr('description');
									isMaster = dish.attr('isMaster');
									isInactive = dish.attr('isInactive');
									var portion1 = null;
									var portion2 = null;
									var portion3 = null;
									var portion4 = null;
									var portion5 = null;
									var portion6 = null;
									var portion7 = null;
									var portion8 = null;
									var portion9 = null;
									//if (index == 0)
										//alert("plateslate loadPortions dish type " + type + " name " + name + " description " + description);
									// e.g. dish type Dinner name Pizza and Salad description BGE smoked
									//var segments = new Array();
									//var segment;
									//var children = dish.children();
									//$(children).find('segment').each(function() {
									var index2 = 0;
									$(this).find('segment').each(function() {
										var segmantType = $(this).attr('type');
										//var segmentName = segment.attr('name');
										var segmentDescription = $(this).attr('description');
										//var segmentIsMaster = $(this).attr('isMaster');
										//var segmentIsInactive = $(this).attr('isInactive');
										var segmentName = $(this).text();
										//if (index2 == 0)
											//alert("plateslate loadPortions segment type " + segmantType + " name " + segmentName + " description " + segmentDescription);
										//segments.push(getPortionByName(segmentName));
										// tjs 120214
										//var portion = getPortionByName(segmentName);
										var portionId = portionNames[segmentName];
										//if (index2 == 0)
											//alert("plateslate loadPortions portionId " + portionId);
										switch (index2++) {
										case 0:
											portion1 = portionId;
											break;
										case 1:
											portion2 = portionId;
											break;
										case 2:
											portion3 = portionId;
											break;
										case 3:
											portion4 = portionId;
											break;
										case 4:
											portion5 = portionId;
											break;
										case 5:
											portion6 = portionId;
											break;
										case 6:
											portion7 = portionId;
											break;
										case 7:
											portion8 = portionId;
											break;
										case 8:
											portion9 = portionId;
											break;
										}
									});
									//var plate = new Plate(index++, type, name, description, isMaster, portion1.id, portion2.id, portion3.id, portion4.id, portion5.id, portion6.id, portion7.id, portion8.id, portion9.id, isInactive);
									var plate = new Plate(index++, type, name, description, isMaster, portion1, portion2, portion3, portion4, portion5, portion6, portion7, portion8, portion9, isInactive);
									plates.push(plate);

									//var portion = new Portion(null, type, name, description, isMaster, isInactive);
									//morsels.push(portion);
							         //alert("plateslate doRestoreFromBackup preference type " + preferenceType + " preferenceName " + preferenceName + " preferenceValue " + preferenceValue);
								});
						         //alert("plateslate loadPortions plates length " + plates.length);
						         insertPlateMasterData(false, xml);
						         //alert("plateslate doRestoreFromBackup plates synchronized length " + plates.length);						         
						}
						//alert("plateslate loadPortions plates loaded... portions length " + portions.length);
					}
				},
				displayerrormessage
				);
			}
		);
	//alert("plateslate loadPortions isPortionMasterDataInserted " + isPortionMasterDataInserted);
}

function populatePortion() {
	populatePortionMasterData();
}

function populatePortionMasterData() {

	var i = 1;
	var portly;
	if (portions.length > 0) {
		//alert("plateslate populatePortionMasterData portions len " + portions.length);
		portions.length = 0;
		if (plates.length > 0) {
			//alert("plateslate populatePortionMasterData plates len " + plates.length);
			plates.length = 0;
		}
		if (slates.length > 0) {
			//alert("plateslate populatePortionMasterData slates len " + slates.length);
			slates.length = 0;
		}		
	}
	
	//Grains
	portly = new Portion(i, "Grain", "Bagels", "Bagels", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Grain", "Bran Flakes", "Bran Flakes", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Grain", "English Muffins", "English Muffins", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Grain", "Irish Bread", "Irish Bread", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Grain", "Muffins", "Muffins", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Grain", "Pancakes", "Pancakes", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Grain", "Pasta", "Pasta", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Grain", "Pecan Buns", "Pecan Buns", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Grain", "Puffs", "Puffs", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Grain", "Rice", "Rice", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Grain", "Schredded Wheat", "Schredded Wheat", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Grain", "Toast", "Toast", 1, 0);
	portions.push(portly);
	
	//Proteins
	i++;
	portly = new Portion(i, "Protein", "Bean Products", "(Baked, Green, Lima)", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Protein", "Beef Products", "(Ground, Roast)", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Protein", "Eggs", "Eggs", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Protein", "Fish", "Fish", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Protein", "Legeume Products", "(Whole Peanuts, Green, Peanut Butter)", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Protein", "Poultry", "(Chicken, Turkey)", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Protein", "Pork Products", "(Bacon, Ham, Chops)", 1, 0);
	portions.push(portly);
	
	//Vegetables
	i++;
	portly = new Portion(i, "Vegetables", "Asparagas", "Asparagas", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Vegetables", "Beets", "Beets", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Vegetables", "Brussel Sprouts", "Brussel Sprouts", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Vegetables", "Cauliflour", "Cauliflour", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Vegetables", "Celery", "Celery", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Vegetables", "Corn", "Corn", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Vegetables", "Cucomber", "(Cukes, Pickles, Zukini)", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Vegetables", "Leafy Produce", "Leafy Produce", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Vegetables", "Onions", "Onions", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Vegetables", "Peas", "Peas", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Vegetables", "Peppers", "Peppers", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Vegetables", "Potatos", "Potatos", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Vegetables", "Squash", "Squash", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Vegetables", "Radishes", "Radishes", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Vegetables", "Tomatoes", "Tomatoes", 1, 0);
	portions.push(portly);
	
	//Fruits
	i++;
	portly = new Portion(i, "Fruits", "Apples", "Apples", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Fruits", "Apricots", "Apricots", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Fruits", "Bananas", "Bananas", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Fruits", "Berries", "Berries", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Fruits", "Cherries", "Cherries", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Fruits", "Citrous", "(Grapefruit, Oranges)", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Fruits", "Grapes", "(Whole, Raisons)", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Fruits", "Peaches", "(Whole, Necturines)", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Fruits", "Pears", "Pears", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Fruits", "Plums", "Plums", 1, 0);
	portions.push(portly);

	//Dairy
	i++;
	portly = new Portion(i, "Dairy", "Cheese", "Cheese", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Dairy", "Ice Cream", "Ice Cream", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Dairy", "Milk", "Milk", 1, 0);
	portions.push(portly);
	i++;
	portly = new Portion(i, "Dairy", "Yogurt", "Yogurt", 1, 0);
	portions.push(portly);
	
	// tjs 120210
	//insertPortionMasterData();
	// tjs 120216
	insertPortionMasterData(true, null);
}

// tjs 120211
//function insertPortionMasterData(isStaticData) {
//function insertPortionMasterData(isStatic, xml) {
function insertPortionMasterData(isStatic, xml) {
	var len = portions.length;
	var i = 0;
	//alert("plateslate insertPortionMasterData len " + len);
	while (i < len) {
		var portion = portions[i++];
		addToPortion(portion);
	}
	/*
	if (isStaticData) {
		portions.length = 0;	
		loadPortions(true);
	}
	*/
	portions.length = 0;
	//loadPortions(isStaticData);
	//alert ("insertPortionMasterData isStatic " + isStatic + " i " + i);
	loadPortions(isStatic, xml);
}

function addToPortion(portion) {
	//alert("plateslate addToPortion type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
			systemDB.transaction(
				function(transaction) {
					transaction.executeSql(
					//'SELECT cart_sess, cart_sku,  cart_item_name, cart_qty, cart_price FROM shopcart where cart_sess=? and cart_sku=?;',[sid, sku],
							'SELECT id, type, name,  description, master, isInactive FROM portion where name=?;',[portion.name],

					function (transaction, result) {
					if (result.rows.length >0) {
						var row = result.rows.item(0);

						systemDB.transaction(
							function(transaction) {
								transaction.executeSql(
										// tjs 120227
								//'update portion set description=? where name=?;',
								//[portion.description, portion.name],
								'update portion set type=?, description=?, isInactive=? where name=?;',
								[portion.type, portion.description, portion.isInactive, portion.name],
								function(){
									//trxDone('update via add');
									//alert("plateslate addToPortion updated: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
								},
								displayerrormessage
								);
							}
						);
					} else {
						//alert("plateslate addToPortion inserting: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
						systemDB.transaction(
							function(transaction) {
							transaction.executeSql(
							'INSERT INTO portion (type, name,  description, master, isInactive) VALUES (?,?,?,?,?);',
							[portion.type, portion.name, portion.description, portion.master, portion.isInactive],
							function(){
								//trxDone('add');
								//alert("plateslate addToPortion added: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
							},
							displayerrormessage
							);
							}
						);
					}
				}
				);
			}
			);
	}

function getPortionByName(name) {
	var len = portions.length;
	for (var i = 0; i < len; i++) {
		var portion = portions[i];
		if (portion != null && name == portion.name) {
			return portion;
		}
	}
	portion = new Portion(0, 'unknown', 'unknown', 'unknown', 0, 1);
	return portion;
}

// tjs 120211
function loadPlates(isStatic, xml)
{
	var isPlateMasterDataInserted = false;
	var id;
	var type;
	var name;
	var description;
	var master;
	var portion1;
	var portion2;
	var portion3;
	var portion4;
	var portion5;
	var portion6;
	var portion7;
	var portion8;
	var portion9;
	var isInactive;
	// tjs 120213
	var plateNames = new Array();
	systemDB.transaction(
			function(transaction) {
				transaction.executeSql(
				'SELECT id, type, name,  description, master, portion1, portion2, portion3, portion4, portion5, portion6, portion7, portion8, portion9, isInactive FROM plate', null,
				
				function (transaction, result) {
					//alert("plateslate loadPlates result.rows.length " + result.rows.length);
					if (result.rows.length <=0) {
						isPlateMasterDataInserted = false;
						//alert("plateslate loadPlates isPlateMasterDataInserted " + isPlateMasterDataInserted);
						// tjs 120214
						if (isStatic == true) {
							populatePlate();
						} else { // wait for the transactions...
							setTimeout(function() {
								//alert('hello');
								loadPlates(isStatic, xml);
								},1250);							
						}
						//e.g. test data 40 plates
					} else {
						for (var i=0; i < result.rows.length; i++) {
							var row = result.rows.item(i);
							id=parseInt(row.id);
							type = row.type;
							name = row.name;
							description = row.description;
							master=parseInt(row.master);
							portion1=parseInt(row.portion1);
							portion2=parseInt(row.portion2);
							portion3=parseInt(row.portion3);
							portion4=parseInt(row.portion4);
							portion5=parseInt(row.portion5);
							portion6=parseInt(row.portion6);
							portion7=parseInt(row.portion7);
							portion8=parseInt(row.portion8);
							portion9=parseInt(row.portion9);
							isInactive=parseInt(row.isInactive);
							var plate = new Plate(id, type, name, description, master, portion1, portion2, portion3, portion4, portion5, portion6, portion7, portion8, portion9, isInactive);
							//alert("plateslate loadPlates for id " + id + " have plate name " + plate.name);
							//alert("plateslate loadPlates for id " + id + " have plate name " + plate.name + " type " + type + " portion1 " + portion1);
							plates[id] = plate;
							// tjs 120213
							if (isStatic == false) {
								plateNames[plate.name] = id;
							}
						}
						isPlateMasterDataInserted = true;
						// e.g. 41
						//alert("plateslate loadPlates isPlateMasterDataInserted " + isPlateMasterDataInserted + " plates len " + plates.length + " isStatic " + isStatic);
						//now that the dependent plates are stored in the database
						//and available in the cache array, plates[], load the slates that use plates...
						if (isStatic == true) {
							truncateSlates();
						} else {
							// tjs 120211
							// we are doing a restore...
					         // at this point portions and plates are restored.  The slated plates (i.e. menu plans) are empty
					         // but the app could be used in the empty state and new slates can be added.
							// TBD should this be a preference?
							// we need to restore the slates at this point...
							/*
							 * e.g.
							 *  <slates>
								<slate name="February 6, 2012" dow="Monday" id="51">
								<plates>
								<plate name="Puffs-n-Stuff" type="Breakfast" description="Cereal, Fruit, etc.">
								<portions>
								<portion type="Grain">Puffs</portion>
								<portion type="Fruits">Berries</portion>
								<portion type="Dairy">Milk</portion>
								<portion type="Grain">Muffins</portion>
								</portions>
								</plate>
								...
								</plates>
								</slate>
								...
								</slates>
							*/
							//alert ("plateSlateCellApp loadPlates plateNames length " + plateNames.length);
							var breakfastId;
							var lunchId;
							var dinnerId;
							/*
							var breakfastPortions = new Array();
							var lunchPortions = new Array();
							var dinnerPortions = new Array();
							*/
							var breakfastPortions;
							var lunchPortions;
							var dinnerPortions;
							$(xml).find('slate').each(function() {
								var slate = $(this);
								var slateName = slate.attr('name'); // e.g. February 6, 2012
								var slateDescription = slate.attr('dow'); // description is the day of the week, e.g. Monday
								var slateDate = new Date(slateName);
								slateDate.setHours(0, 0, 0, 0);
								//breakfastPortions.length = 0;
								//lunchPortions.length = 0;
								//dinnerPortions.length = 0;
								//alert ("plateSlateCellApp loadPlates slateName " + slateName + " date " + slateDate);
						         //alert("plateslate loadPlates name " + date + " dow " + dow);
								$(this).find('plate').each(function() {
									var plate = $(this);
									var name = plate.attr('name');
									var type = plate.attr('type');
									//alert ("plateSlateCellApp loadPlates plateName " + name + " type " + type);
									//var description = plate.attr('description');
									var plateId = plateNames[name];
									//if (0 == debugLoopCount%10) {
									//	alert ("plateSlateCellApp loadPlates debugLoopCount " + debugLoopCount + " plateId " + plateId + " slateName " + slateName);
										// e.g. plateSlateCellApp loadPlates debugLoopCount 0 plateId 676 slateName January 14, 2012
									//}
									if (type == "Breakfast") {
										breakfastId = plateId;
										breakfastPortions = new Array();
									}
									else if (type == "Lunch") {
										lunchId = plateId;
										lunchPortions = new Array();
									}
									// tjs 120217
									//else {
									else if (type == "Dinner") {
										dinnerId = plateId;
										dinnerPortions = new Array();
									}
									
									$(this).find('portion').each(function() {
										var portion = $(this);
										//var portionType = portion.attr('type');
										var portionName = $(this).text();
										//var portion = getPortionByName(portionName);
										//var portionId = portion.id;
										//if (0 == debugLoopCount%10) {
										//	alert ("plateSlateCellApp loadPlates debugLoopCount " + debugLoopCount + " portionName " + portionName);
											// e.g. plateSlateCellApp loadPlates debugLoopCount 0 portionName Bran Flakes
										//}
										var portionId = portionNames[portionName];
										//if (0 == debugLoopCount%10) {
										//	alert ("plateSlateCellApp loadPlates debugLoopCount " + debugLoopCount + " plate name " + name + " portionId " + portionId + " slateName " + slateName);
										//}
										//debugLoopCount++;
										if (type == "Breakfast") {
											breakfastPortions.push(portionId);
										}
										else if (type == "Lunch") {
											lunchPortions.push(portionId);
										}
										//else {
										else if (type == "Dinner") {
											dinnerPortions.push(portionId);
										}
									}); // end loop through portions
								}); // end finding plates in the current slate to get plateIds
								insertRestoredSlate(slateDate, slateName, slateDescription, breakfastId, lunchId, dinnerId, breakfastPortions, lunchPortions, dinnerPortions);
							}); // end finding slates in the xml
							setTimeout(function() {
								//alert('hello');
								restoreSlatesCompleted();
								// tjs 120217
							//},1250);														
								},2250);														
						} // end not isStatic 
						//alert("plateslate loadPlates slates loaded... plates len " + plates.length);
					}
				},
				displayerrormessage
				);
			}
		);
	//alert("plateslate loadPlates isPlateMasterDataInserted " + isPlateMasterDataInserted);
}

// tjs 120214
function insertRestoredSlate(slateDate, slateName, slateDescription, breakfastId, lunchId, dinnerId, breakfastPortions, lunchPortions, dinnerPortions) {
	var slateId = 0;
	//alert ("plateSlateCellApp insertRestoredSlate slateName " + slateName + " date " + slateDate + " breakfastId " + breakfastId + " lunchId " + lunchId + " dinnerId " + dinnerId + " bportlen " + breakfastPortions.length  + " lportlen " + lunchPortions.length + " dportlen " + dinnerPortions.length);
	systemDB.transaction(
			function(transaction) {
				transaction.executeSql(
						'INSERT INTO slate (date, name,  description, breakfast, lunch, dinner, isInactive) VALUES (?,?,?,?,?,?,?);',
						[slateDate, slateName, slateDescription, breakfastId, lunchId, dinnerId, 0],
						//function(){
			//trxDone('add');
			//alert("plateslate addToPortion added: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
						//},
						//displayerrormessage
			            function (transaction, result) {
			                if (!result.rowsAffected) {
			                    // Previous insert failed. Bail.
			                    alert('plateSlateCellApp insertRestoredSlate No rows affected!');
			                    return false;
			                }
			                //id=parseInt(row.id);
			                slateId = parseInt(result.insertId);
			                //alert('plateSlateCellApp insertRestoredSlate slateId ' + slateId);
			                var type = "Breakfast";
			                var portionId;
			                for (var i = 0; i < breakfastPortions.length; i++) {
			                	portionId = breakfastPortions[i];
			                	insertSlateFoodPortion(slateId, type, portionId, 1);
			                }
			                type = "Lunch";
			                for (var i = 0; i < lunchPortions.length; i++) {
			                	portionId = lunchPortions[i];
			                	insertSlateFoodPortion(slateId, type, portionId, 1);
			                }
			                type = "Dinner";
			                for (var i = 0; i < dinnerPortions.length; i++) {
			                	portionId = dinnerPortions[i];
			                	insertSlateFoodPortion(slateId, type, portionId, 1);
			                }
						} // end function trx result
				); //end trx sql
			}	//end function trx		
	);	//end system trx	
}

function restoreSlatesCompleted() {
	// tjs 120221
	if (importProfile == true) {
	    //$("#login-dial").dialog("close");
		$.mobile.changePage('#home-page');
	} else {
	// tjs 120214
		$('.loginLogout').children('.ui-btn-inner').children('.ui-btn-text').text("Logout");
		$("#login-dial").dialog("close");
	}
	// the database for slates, foods is now restored, next load the cache arrays
	truncateSlates();
}

function populatePlate() {
	// tjs 120210
	populatePlateMasterData();
}

//function populatePlateMasterData() {
function populatePlateMasterData() {

	var i = 1;
	var dish;
	var portion1;
	var portion2;
	var portion3;
	var portion4;
	var portion5;
	var portion6;
	var portion7;
	var portion8;
	var portion9;
	
	if (plates.length > 0) {
		//alert("plateslate populatePlateMasterData plates len " + plates.length);
		plates.length = 0;
	}
	
	//Breakfast
	portion1 = getPortionByName('Schredded Wheat');
	//alert("plateslate populatePlateMasterData portion1 id " + portion1.id);
	portion2 = getPortionByName('Bananas');
	portion3 = getPortionByName('Milk');
	portion4 = getPortionByName('Muffins');
	dish = new Plate(i, "Breakfast", "Schred-n-Bread", "Cereal, Fruit, etc.", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Bran Flakes');
	portion2 = getPortionByName('Grapes');
	portion3 = getPortionByName('Milk');
	portion4 = getPortionByName('Muffins');
	dish = new Plate(i, "Breakfast", "Flakes-n-Bakes", "Cereal, Fruit, etc.", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Puffs');
	portion2 = getPortionByName('Berries');
	portion3 = getPortionByName('Milk');
	portion4 = getPortionByName('Muffins');
	dish = new Plate(i, "Breakfast", "Puffs-n-Stuff", "Cereal, Fruit, etc.", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Eggs');
	portion2 = getPortionByName('Toast');
	dish = new Plate(i, "Breakfast", "Eggs", "Eggs", 1, portion1.id, portion2.id, null, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	dish = new Plate(i, "Breakfast", "Sleep-Late", "No Breakfast!", 1, null, null, null, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	
	//Lunch
	portion1 = getPortionByName('Leafy Produce');
	portion2 = getPortionByName('Cucomber');
	portion3 = getPortionByName('Onions');
	portion4 = getPortionByName('Radishes');
	portion5 = getPortionByName('Tomatoes');
	portion6 = getPortionByName('Eggs');
	dish = new Plate(i, "Lunch", "Chef Salad", "(with hard cooked egg)", 1, portion1.id, portion2.id, portion3.id, portion4.id, portion5.id, portion6.id, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Irish Bread');
	portion2 = getPortionByName('Pork Products');
	portion3 = getPortionByName('Cheese');
	portion4 = getPortionByName('Apples');
	dish = new Plate(i, "Lunch", "Ham Sandwich", "(with fruit)", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Irish Bread');
	portion2 = getPortionByName('Pork Products');
	portion3 = getPortionByName('Cheese');
	portion4 = getPortionByName('Apples');
	dish = new Plate(i, "Lunch", "Grilled Cheese", "(with fruit)", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Irish Bread');
	portion2 = getPortionByName('Legeume Products');
	portion3 = getPortionByName('Berries');
	portion4 = getPortionByName('Apples');
	dish = new Plate(i, "Lunch", "PB Sandwich", "(with fruit)", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Pasta');
	portion2 = getPortionByName('Tomatoes');
	portion3 = getPortionByName('Toast');
	portion4 = getPortionByName('Apples');
	dish = new Plate(i, "Lunch", "Soup-n-Crackers", "(with fruit)", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Irish Bread');
	portion2 = getPortionByName('Fish');
	portion3 = getPortionByName('Celery');
	portion4 = getPortionByName('Cucomber');
	portion5 = getPortionByName('Apples');
	dish = new Plate(i, "Lunch", "TunaFish-n-Pita", "(with fruit)", 1, portion1.id, portion2.id, portion3.id, portion4.id, portion5.id, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Irish Bread');
	portion2 = getPortionByName('Poultry');
	portion3 = getPortionByName('Leafy Produce');
	portion4 = getPortionByName('Apples');
	dish = new Plate(i, "Lunch", "Turkey Sandwich", "(with fruit)", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	dish = new Plate(i, "Lunch", "Skip-Lunch", "Too Busy!", 1, null, null, null, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	
	//Dinner
	portion1 = getPortionByName('Pasta');
	portion2 = getPortionByName('Beef Products');
	portion3 = getPortionByName('Onions');
	portion4 = getPortionByName('Tomatoes');
	dish = new Plate(i, "Dinner", "American Chop Suey", "", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Beef Products');
	portion2 = getPortionByName('Potatos');
	portion3 = getPortionByName('Squash');
	//portion4 = getPortionByName('');
	dish = new Plate(i, "Dinner", "BeefRoast-w-PotVeg", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Beef Products');
	portion2 = getPortionByName('Potatos');
	portion3 = getPortionByName('Onions');
	portion4 = getPortionByName('Squash');
	dish = new Plate(i, "Dinner", "Beef Stew", "", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Poultry');
	portion2 = getPortionByName('Rice');
	portion3 = getPortionByName('Squash');
	//portion4 = getPortionByName('');
	dish = new Plate(i, "Dinner", "BakeChic-w-RiceVeg", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Poultry');
	portion2 = getPortionByName('Rice');
	portion3 = getPortionByName('Squash');
	//portion4 = getPortionByName('');
	dish = new Plate(i, "Dinner", "GrillChic-w-RiceVeg", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Poultry');
	portion2 = getPortionByName('Rice');
	portion3 = getPortionByName('Cheese');
	portion4 = getPortionByName('Squash');
	dish = new Plate(i, "Dinner", "ChicParm-w-RiceVeg", "", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Poultry');
	portion2 = getPortionByName('Potatos');
	portion3 = getPortionByName('Onions');
	portion4 = getPortionByName('Squash');
	dish = new Plate(i, "Dinner", "ChicPotPie", "", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Poultry');
	portion2 = getPortionByName('Rice');
	portion3 = getPortionByName('Squash');
	//portion4 = getPortionByName('');
	dish = new Plate(i, "Dinner", "ChicRotiss-w-RiceVeg", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Corn');
	portion2 = getPortionByName('Milk');
	portion3 = getPortionByName('Potatos');
	//portion4 = getPortionByName('');
	dish = new Plate(i, "Dinner", "Corn Chowder", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Fish');
	portion2 = getPortionByName('Rice');
	portion3 = getPortionByName('Asparagas');
	//portion4 = getPortionByName('');
	dish = new Plate(i, "Dinner", "Haddock-w-RiceVeg", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Beef Products');
	portion2 = getPortionByName('Leafy Produce');
	portion3 = getPortionByName('Cucomber');
	portion4 = getPortionByName('Radishes');
	portion5 = getPortionByName('Tomatoes');
	dish = new Plate(i, "Dinner", "Hamburg-w-Salad", "", 1, portion1.id, portion2.id, portion3.id, portion4.id, portion5.id, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Pork Products');
	portion2 = getPortionByName('Rice');
	portion3 = getPortionByName('Brussel Sprouts');
	//portion4 = getPortionByName('');
	dish = new Plate(i, "Dinner", "Ham Steak-w-RiceVeg", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Beef Products');
	portion2 = getPortionByName('Bean Products');
	portion3 = getPortionByName('Muffins');
	//portion4 = getPortionByName('');
	dish = new Plate(i, "Dinner", "HotDog-w-Beans", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Pasta');
	portion2 = getPortionByName('Beef Products');
	portion3 = getPortionByName('Tomatoes');
	//portion4 = getPortionByName('');
	dish = new Plate(i, "Dinner", "ItalianLasagna", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Pasta');
	portion2 = getPortionByName('Cheese');
	portion3 = getPortionByName('Beef Products');
	//portion4 = getPortionByName('');
	dish = new Plate(i, "Dinner", "Mac-n-Cheese-w-HotDog", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Beef Products');
	portion2 = getPortionByName('Eggs');
	portion3 = getPortionByName('Irish Bread');
	portion4 = getPortionByName('Potatos');
	portion5 = getPortionByName('Brussel Sprouts');
	dish = new Plate(i, "Dinner", "Meatloaf-w-PotVeg", "", 1, portion1.id, portion2.id, portion3.id, portion4.id, portion5.id, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Pork Products');
	portion2 = getPortionByName('Peas');
	dish = new Plate(i, "Dinner", "Pea Soup-w-Ham", "", 1, portion1.id, portion2.id, null, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Pork Products');
	portion2 = getPortionByName('Potatos');
	portion3 = getPortionByName('Brussel Sprouts');
	dish = new Plate(i, "Dinner", "Pork Chops-w-PotVeg", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Pasta');
	portion2 = getPortionByName('Beef Products');
	portion3 = getPortionByName('Eggs');
	portion4 = getPortionByName('Tomatoes');
	dish = new Plate(i, "Dinner", "ItalianRavioli", "", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Pork Products');
	portion2 = getPortionByName('Eggs');
	portion3 = getPortionByName('Toast');
	dish = new Plate(i, "Dinner", "Salami-n-Eggs-w-Toast", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Pork Products');
	portion2 = getPortionByName('Peppers');
	portion3 = getPortionByName('Onions');
	dish = new Plate(i, "Dinner", "Sausage-w-Pepper-n-Onion", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Beef Products');
	portion2 = getPortionByName('Potatos');
	portion3 = getPortionByName('Corn');
	dish = new Plate(i, "Dinner", "Shepards Pie", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Pasta');
	portion2 = getPortionByName('Beef Products');
	portion3 = getPortionByName('Eggs');
	portion4 = getPortionByName('Tomatoes');
	dish = new Plate(i, "Dinner", "ItalianSpaghetti", "", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Beef Products');
	portion2 = getPortionByName('Potatos');
	portion3 = getPortionByName('Squash');
	dish = new Plate(i, "Dinner", "Steak-w-PotVeg", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Beef Products');
	portion2 = getPortionByName('Rice');
	portion3 = getPortionByName('Onions');
	portion4 = getPortionByName('Peppers');
	dish = new Plate(i, "Dinner", "Stuffed Peppers", "", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Beef Products');
	portion2 = getPortionByName('Potatos');
	portion3 = getPortionByName('Eggs');
	portion4 = getPortionByName('Squash');
	dish = new Plate(i, "Dinner", "SwedishMBalls-w-MashPotVeg", "", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Poultry');
	portion2 = getPortionByName('Leafy Produce');
	portion3 = getPortionByName('Cheese');
	portion4 = getPortionByName('Corn');
	dish = new Plate(i, "Dinner", "Tacos", "", 1, portion1.id, portion2.id, portion3.id, portion4.id, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Pasta');
	portion2 = getPortionByName('Fish');
	dish = new Plate(i, "Dinner", "Tuna Noodle Caserole", "", 1, portion1.id, portion2.id, null, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	portion1 = getPortionByName('Poultry');
	portion2 = getPortionByName('Potatos');
	portion3 = getPortionByName('Corn');
	dish = new Plate(i, "Dinner", "Turkey-w-PotVeg", "", 1, portion1.id, portion2.id, portion3.id, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	dish = new Plate(i, "Dinner", "Eat-Out", "Potpourri!", 1, null, null, null, null, null, null, null, null, null, 0);
	plates.push(dish);
	i++;
	
	// tjs 120214
	//insertPlateMasterData();
	insertPlateMasterData(true, null, null);
}

// tjs 120210
//function insertPlateMasterData() {
// tjs 120211
//function insertPlateMasterData(isStatic) {
function insertPlateMasterData(isStatic, xml) {
	var len = plates.length;
	var i = 0;
	//e.g. 41
	//alert("plateslate insertPlateMasterData len " + len);
	while (i < len) {
		var plate = plates[i++];
		addToPlate(plate);
	}
	if (isStatic == false) {
		plates.length = 0;
	}
	loadPlates(isStatic, xml);
}

function addToPlate(plate) {
	//alert("plateslate addToPlate type " + plate.type + " name " + plate.name + " desc " + plate.description + " portion1 " + plate.portion1 + " portion2 " + plate.portion2 + " portion3 " + plate.portion3 + " portion4 " + plate.portion4 + " portion5 " + plate.portion5 + " portion6 " + plate.portion6 + " portion7 " + plate.portion7 + " portion8 " + plate.portion8 + " portion9 " + plate.portion9);
			systemDB.transaction(
				function(transaction) {
					transaction.executeSql(
					//'SELECT cart_sess, cart_sku,  cart_item_name, cart_qty, cart_price FROM shopcart where cart_sess=? and cart_sku=?;',[sid, sku],
						'SELECT id, type, name,  description, master, portion1, portion2, portion3, portion4, portion5, portion6, portion7, portion8, portion9, isInactive FROM plate where name=?;',[plate.name],

						function (transaction, result) {
							if (result.rows.length >0) {
								var row = result.rows.item(0);

								systemDB.transaction(
										function(transaction) {
											transaction.executeSql(
													//'update plate set description=? where name=?;',
													//[plate.description, plate.name],
													// tjs 120228
													//'update plate set description=?, portion1=?, portion2=?, portion3=?, portion4=?, portion5=?, portion6=?, portion7=?, portion8=?, portion9=? where name=?;',
													//[plate.description, plate.portion1, plate.portion2, plate.portion3, plate.portion4, plate.portion5, plate.portion6, plate.portion7, plate.portion8, plate.portion9, plate.name],
													'update plate set type=?, description=?, portion1=?, portion2=?, portion3=?, portion4=?, portion5=?, portion6=?, portion7=?, portion8=?, portion9=?, isInactive=? where name=?;',
													[plate.type, plate.description, plate.portion1, plate.portion2, plate.portion3, plate.portion4, plate.portion5, plate.portion6, plate.portion7, plate.portion8, plate.portion9, plate.isInactive, plate.name],
													function(){
														//trxDone('update via add');
														//alert("plateslate addToPortion updated: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
													},
													displayerrormessage
											);
										}
								);
							} else {
								//alert("plateslate addToPlate inserting: type " + plate.type + " name " + plate.name + " desc " + plate.description + " master " + plate.master + " isInactive? " + plate.isInactive + " portion #1 " + plate.portion1);
								systemDB.transaction(
										function(transaction) {
											transaction.executeSql(
													'INSERT INTO plate (type, name,  description, master, portion1, portion2, portion3, portion4, portion5, portion6, portion7, portion8, portion9, isInactive) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);',
													[plate.type, plate.name, plate.description, plate.master, plate.portion1, plate.portion2, plate.portion3, plate.portion4, plate.portion5, plate.portion6, plate.portion7, plate.portion8, plate.portion9, plate.isInactive],
													function(){
														//trxDone('add');
														//alert("plateslate addToPortion added: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
													},
													displayerrormessage
											);
										}
								);
							}
						}
					);
				}
			);
	}

function truncateSlates() {
	// for now consider one month or four weeks maximum...
	var maximumSlateCount = 28;
	 // for test only
	systemDB.transaction(
			function(transaction) {
				transaction.executeSql(
				'SELECT id, date, name, isInactive FROM slate order by id', null,
				
				function (transaction, result) {
					//alert("plateslate loadPlates result.rows.length " + result.rows.length);
					if (result.rows.length > 0) {
						resultsLen = result.rows.length;
						if (resultsLen > maximumSlateCount) {
							var truncateCount = resultsLen - maximumSlateCount;
							var slateIds = new Array();
							var lastDateName;
							for (var i=0; i < truncateCount; i++) {
								var row = result.rows.item(i);
								id=parseInt(row.id);
								date = row.date;
								name = row.name;
								lastDateName = name;
								slateIds.push(id);
							} // end for loop
							//deleteSlatesFoodsBeforeDate(lastDateName);
							var len = slateIds.length;
							for (var i = 0; i < len; i++) {
								deleteSlatesFoodsBeforeDate(slateIds[i]);
								var torf = false;
								if (i == len - 1) {
									torf = true;
								}
								deleteSlatesBeforeDate(slateIds[i], torf);
							}
						} else {
							loadSlates();
						}
					} else {
						loadSlates();
					} // end if rows found or not
				});
			});
}

function deleteSlatesFoodsBeforeDate(id) {
	systemDB.transaction(
			function(transaction) {
				transaction.executeSql(
				'DELETE from food where slate = ?', [id],
				
				function (transaction, result) {
					//alert("plateslate loadPlates result.rows.length " + result.rows.length);
					//deleteSlatesBeforeDate(date);
				});
			});
	
}

function deleteSlatesBeforeDate(id, torf) {
	systemDB.transaction(
			function(transaction) {
				transaction.executeSql(
				'DELETE from slate where id = ?', [id],
				
				function (transaction, result) {
					//alert("plateslate loadPlates result.rows.length " + result.rows.length);
					if (torf) {
						loadSlates();
					}					
				});
			});	
}

function loadSlates()
{
	var today = new Date();
	today.setHours(0, 0, 0, 0);
	var todayName = today.toLocaleDateString();
	var weekdayName = weekday[today.getDay()];
	var isSlateDataInserted = false;
	var id;
	var offset = slateOffsetThreshold;
	var date;
	var name;
	var description;
	var breakfastId;
	var lunchId;
	var dinnerId;
	var isInactive;
	var slate;
	var currentSlate;
	var breakfastPlate;
	var lunchPlate;
	var dinnerPlate;
	var markIndex = -1;
	var index = 0;
	var tempSlates = new Array();
	var tempSlatesLen = 0;
	var resultsLen = 0;
	var tempSlate;
	// needed to ensure no duplicates are listed in the slates
	var lastSlateName = null;

	//alert("plateslate loadSlates todayName " + todayName);

	//TODO populate array and inspect it for offset from today.  if no today add it.
	//then ensure the array remains in sync with the database when user transitions to a new offset.
		
	if (slates.length > 0) {
		//alert("plateslate loadSlates slates len " + slates.length);
		// tjs 110816
		for (var i = 0; i < slates.length; i++) {
			//tjs 110819
			// tjs 120119
			//if (typeof(slates[i] !== 'undefined')) {
			if (typeof(slates[i]) !== 'undefined') {
				// tjs 110819
				destroySlate(slates[i]);
			}
		}
		slates.length = 0;
	}		
	//alert("plateslate loadSlates cleared slates len " + slates.length);
	systemDB.transaction(
			function(transaction) {
				transaction.executeSql(
				'SELECT id, date, name,  description, breakfast, lunch, dinner, isInactive FROM slate', null,
				
				function (transaction, result) {
					//alert("plateslate loadPlates result.rows.length " + result.rows.length);
					if (result.rows.length > 0) {
						resultsLen = result.rows.length;
						for (var i=0; i < result.rows.length; i++) {
							var row = result.rows.item(i);
							id=parseInt(row.id);
							date = row.date;
							name = row.name;
							description = row.description;
							//alert("plateslate loadSlates name " + name + " id " + id + " breakfastId " + row.breakfast + " lunchId " + row.lunch + " dinnerId " + row.dinner);
							breakfastId=parseInt(row.breakfast);
							lunchId=parseInt(row.lunch);
							dinnerId=parseInt(row.dinner);
							isInactive=parseInt(row.isInactive);
							//alert("plateslate loadSlates name " + name + " id " + id + " breakfastId " + breakfastId + " lunchId " + lunchId + " dinnerId " + dinnerId);
							tempSlates[index++] = new Slate(id, 0, date, name, description, breakfastId, lunchId, dinnerId, null, null, null, isInactive);
							//viewSlate("LOADSLATES SLATE", slate);
							//alert("plateslate loadSlates slate name " + slate.name + " slate id " + slate.id + " breakfastId " + slate.breakfastId + " lunchId " + slate.lunchId + " dinnerId " + slate.dinnerId + " name " + name + " todayName " + todayName);
							//alert("plateslate loadSlates for id " + id + " have slate name " + slate.name + " breakfastId " + breakfastId + " lunchId " + lunchId + " dinnerId " + dinnerId + " tempIndex " + index + " markIndex " + markIndex);
							var tempIndex = index - 1;
							//alert("plateslate loadSlates tempSlate index " + tempIndex + " name " + tempSlates[tempIndex].name + " id " + tempSlates[tempIndex].id + " breakfastId " + tempSlates[tempIndex].breakfastId + " lunchId " + tempSlates[tempIndex].lunchId + " dinnerId " + tempSlates[tempIndex].dinnerId);
							//alert("plateslate loadSlates (after copy source destroyed) tempSlate index " + tempIndex + " name " + tempSlates[tempIndex].name + " id " + tempSlates[tempIndex].id + " breakfastId " + tempSlates[tempIndex].breakfastId + " lunchId " + tempSlates[tempIndex].lunchId + " dinnerId " + tempSlates[tempIndex].dinnerId);							
							//alert("plateslate loadPlates for id " + id + " have plate name " + plate.name);
							//alert("plateslate loadSlates for id " + id + " have today name " + todayName + " have slate name " + slate.name + " markIndex " + markIndex + " index " + index + " breakfastId " + breakfastId + " lunchId " + lunchId + " dinnerId " + dinnerId);
						}
						//alert("plateslate loadSlates tempSlates.length " + tempSlates.length + " have today name " + todayName);
						tempSlates.sort(compareTimes);
						//alert("plateslate loadSlates after sort tempSlates.length " + tempSlates.length);
						for (var i=0; i < tempSlates.length; i++) {
							// deep copy not needed here...
							slate = tempSlates[i];
							//alert("plateslate loadSlates sorted by date slate id " + slate.id);
							name = slate.name;
							//alert("plateslate loadSlates slate name " + slate.name + " slate id " + slate.id + " breakfastId " + slate.breakfastId + " lunchId " + slate.lunchId + " dinnerId " + slate.dinnerId + " name " + name + " todayName " + todayName);
							if (name == todayName) {
								markIndex = i;
							}
							//alert("plateslate loadPlates for id " + id + " have plate name " + plate.name);
							//alert("plateslate loadSlates for id " + slate.id + " have today name " + todayName + " have slate name " + slate.name + " markIndex " + markIndex + " index " + index + " breakfastId " + slate.breakfastId + " lunchId " + slate.lunchId + " dinnerId " + slate.dinnerId);
						}
						
						tempSlatesLen = tempSlates.length;
						//alert("plateslate loadSlates result len " + result.rows.length + " tempSlatesLen " + tempSlatesLen + " markIndex " + markIndex);
						//found today's date...
						if (markIndex >= 0) {
							// DEBUG
							//viewSlate("CURRENTSLATE", currentSlate);
							lastSlateName = null;
							offset = slateOffsetThreshold;
							for (var i = markIndex; i >= 0; i--) {
								slate = copySlate(tempSlates[i]);
								destroySlate(tempSlates[i]);
								if (lastSlateName == null) {
									lastSlateName = slate.name;
								} else if (slate.name == lastSlateName) {
									continue;	// skip duplicate!
								} else {
									lastSlateName = slate.name;
								}
								if (i == markIndex) {
									currentSlate = slate;
								}
								slate.offset = offset;
								slates[offset] = slate;
								//viewSlate("LOADSLATES MARKBACK", slate);
								appendFood(loadSlatesCallback, 0, 100, slate);
								//alert("plateslate loadSlates from marked index backwards for i " + i + " have slate name " + slate.name + " offset " + offset);
								offset--;
							}
							if (tempSlatesLen - 1 > markIndex) {
								lastSlateName = null;
								offset = slateOffsetThreshold + 1;
								for (var i = markIndex + 1; i < tempSlatesLen; i++) {
									slate = copySlate(tempSlates[i]);
									destroySlate(tempSlates[i]);
									if (lastSlateName == null) {
										lastSlateName = slate.name;
									} else if (slate.name == lastSlateName) {
										continue;	// skip duplicate!
									} else {
										lastSlateName = slate.name;
									}
									slate.offset = offset;
									slates[offset] = slate;
									//viewSlate("LOADSLATES BACK2MARK", slate);
									appendFood(loadSlatesCallback, 0, 100, slate);
									//alert("plateslate loadSlates from marked index forewards for i " + i + " have slate name " + slate.name + " offset " + offset);
									offset++;
								}
							}
							appendFood(loadSlatesCallback, 0, 1, currentSlate);
							//viewSlate("CURRENTSLATE", currentSlate);
							//alert("plateslate loadSlates currentSlate id " + currentSlate.id + " have slate name " + currentSlate.name + " breakfastPortions len " + currentSlate.breakfastPortions.length);
						} 
						else {
							//today's date not entered yet (i.e. markIndex remained -1)
							offset = slateOffsetThreshold;
							breakfastPlate = getRandomPlate("Breakfast", offset);
							lunchPlate = getRandomPlate("Lunch", offset);
							dinnerPlate = getRandomPlate("Dinner", offset);
							slate = new Slate(0, offset, today, today.toLocaleDateString(), weekdayName, breakfastPlate.id, lunchPlate.id, dinnerPlate.id, null, null, null, 0);
							// DEBUG
							//viewSlate("NO MARKINDEX", slate);
							//alert("plateslate loadSlates today's new slate markIndex -1 " + slate.name);
							//TODO embed assignment in append...
							appendSlate(loadSlatesCallback, slate, offset);
							//alert("plateslate loadSlates today's new slate id " + slate.id);
							//alert("plateslate loadSlates (no markIndex) for today have slate name " + slate.name + " offset " + offset);
							if (tempSlatesLen > 0) {
								lastSlateName = null;
								offset = slateOffsetThreshold - 1;
								for (var i = tempSlatesLen - 1; i >= 0; i--) {
									slate = copySlate(tempSlates[i]);
									destroySlate(tempSlates[i]);
									if (lastSlateName == null) {
										lastSlateName = slate.name;
									} else if (slate.name == lastSlateName) {
										continue;	// skip duplicate!
									} else {
										lastSlateName = slate.name;
									}
									slate.offset = offset;
									slates[offset] = slate;
									appendFood(loadSlatesCallback, 0, 100, slate);
									//alert("plateslate loadSlates (no markIndex) from today backwards for i " + i + " have slate name " + slate.name + " offset " + offset);
									offset--;
								}
							}					
						}						
						isSlateDataInserted = true;
						// e.g. 1
						//alert("plateslate loadSlates isSlateDataInserted " + isSlateDataInserted + " slates len " + slates.length);
					} else {
						//today's date not entered yet and indeed no slates were ever entered...
						offset = slateOffsetThreshold;
						breakfastPlate = getRandomPlate("Breakfast", offset);
						lunchPlate = getRandomPlate("Lunch", offset);
						dinnerPlate = getRandomPlate("Dinner", offset);
						slate = new Slate(0, offset, today, today.toLocaleDateString(), weekdayName, breakfastPlate.id, lunchPlate.id, dinnerPlate.id, null, null, null, 0);
						// DEBUG
						//viewSlate("NO SLATES", slate);
						//alert("plateslate loadSlates today's new slate markIndex -1 " + slate.name);
						//TODO embed assignment in append...
						appendSlate(loadSlatesCallback, slate, offset);
						//alert("plateslate loadSlates today's new slate id " + slate.id);
						//alert("plateslate loadSlates (no markIndex) for today have slate name " + slate.name + " offset " + offset);
					} // end if not entered or entered
				},
				displayerrormessage
				);	// end trx sql

			}	// end outer function trx
		); // end outer system trx
	//alert("plateslate loadSlates isSlateDataInserted " + isSlateDataInserted);
}

// tjs 120213 deprecated!
function loadSlatesCallback(torf) {
	if (torf == true) {
		populateSlate();
	}
}

function addToSlate(slate) {
	//alert("plateslate addToSlate name " + slate.name + " desc " + slate.description);

			var id = 0;
			systemDB.transaction(
				function(transaction) {
					transaction.executeSql(
							'SELECT id, date, name,  description, breakfast, lunch, dinner, isInactive FROM slate where name=?;',[slate.name],

							function (transaction, result) {
						//alert("plateslate addToSlate select result.rows.length " + result.rows.length);
								if (result.rows.length >0) {
									var row = result.rows.item(0);
									id=parseInt(row.id);

									systemDB.transaction(
											function(transaction) {
												transaction.executeSql(
														'update slate set description=?, breakfast=?, lunch=?, dinner=? where name=?;',
														[slate.description, slate.breakfastId, slate.lunchId ,slate.dinnerId, slate.name],
														function(){
															//trxDone('update via add');
															//alert("plateslate addToPortion updated: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
														},
														displayerrormessage
												); //end trx sql
											}	// end function trx		
									); // end systemDB trx
									appendFood(loadSlatesCallback, 0, 1, slate);							    		
								} else {	// i.e. no rows found in query
									//alert("plateslate addToPlate inserting: type " + plate.type + " name " + plate.name + " desc " + plate.description + " master " + plate.master + " isInactive? " + plate.isInactive + " portion #1 " + plate.portion1);
									systemDB.transaction(
											function(transaction) {
												transaction.executeSql(
														'INSERT INTO slate (date, name,  description, breakfast, lunch, dinner, isInactive) VALUES (?,?,?,?,?,?,?);',
														[slate.date, slate.name, slate.description, slate.breakfastId, slate.lunchId, slate.dinnerId, slate.isInactive],
														//function(){
											//trxDone('add');
											//alert("plateslate addToPortion added: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
														//},
														//displayerrormessage
											            function (transaction, result) {
											                if (!result.rowsAffected) {
											                    // Previous insert failed. Bail.
											                    alert('plateslate addToSlate No rows affected!');
											                    return false;
											                }
											                id = result.insertId;
											                //alert('plateslate addToSlate insert ID was ' + id);
											                slate.id = id;
											                //appendFood(transaction, slate);
											                appendFood(loadSlatesCallback, 0, 1, slate);
														} // end function trx result
												); //end trx sql
											}	//end function trx		
									);	//end system trx
								}	// end no rows found block
							}	// end function trx
					);	// end trx sql
			}	//end function trx
		);	// end systemDB trx
			//return id;
	}

function appendSlate(loadSlatesCallback, slate, offset) {
	//alert("plateslate appendSlate name " + slate.name + " desc " + slate.description);
/*
 * 						'CREATE TABLE  IF NOT EXISTS slate ' +
						' (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
						' date varchar(16), name varchar(32),  description varchar(100), breakfast integer, lunch integer, dinner integer, isInactive integer );'

 * 	*/
			var id = 0;
			systemDB.transaction(
				function(transaction) {
					transaction.executeSql(
							'SELECT id, date, name,  description, breakfast, lunch, dinner, isInactive FROM slate where name=?;',[slate.name],

							function (transaction, result) {
						//alert("plateslate addToSlate select result.rows.length " + result.rows.length);
								if (result.rows.length >0) {
									var row = result.rows.item(0);
									id=parseInt(row.id);

									systemDB.transaction(
											function(transaction) {
												transaction.executeSql(
														'update slate set description=?, breakfast=?, lunch=?, dinner=? where name=?;',
														[slate.description, slate.breakfastId, slate.lunchId ,slate.dinnerId, slate.name],
														function(){
															//trxDone('update via add');
															//alert("plateslate addToPortion updated: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
														},
														displayerrormessage
												); //end trx sql
											}	// end function trx		
									); // end systemDB trx
									appendFood(loadSlatesCallback, 0, 1, slate);							    		
								} else {	// i.e. no rows found in query
									//alert("plateslate appendSlate inserting: name " + slate.name + " desc " + slate.description + " breakfastId " + slate.breakfastId + " isInactive? " + slate.isInactive);
									systemDB.transaction(
											function(transaction) {
												transaction.executeSql(
														'INSERT INTO slate (date, name,  description, breakfast, lunch, dinner, isInactive) VALUES (?,?,?,?,?,?,?);',
														[slate.date, slate.name, slate.description, slate.breakfastId, slate.lunchId, slate.dinnerId, slate.isInactive],
														//function(){
											//trxDone('add');
											//alert("plateslate addToPortion added: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
														//},
														//displayerrormessage
											            function (transaction, result) {
											                if (!result.rowsAffected) {
											                    // Previous insert failed. Bail.
											                    alert('plateslate appendSlate No rows affected!');
											                    return false;
											                }
											                id = result.insertId;
											                //alert('plateslate appendSlate insert ID is ' + id);
											                slate.id = id;
											                //alert('plateslate appendSlate insert ID is ' + id + " slate id " + slate.id + " offset " + offset);
											                //alert('plateslate appendSlate insert ID is ' + id + " slate id " + slate.id + " offset " + offset);
											                //viewSlate("APPENDSLATE", slate);
											                slates[offset] = slate;
											                //alert("plateslate appendSlate slate id " + slate.id + " call append food breakfast " + slate.breakfastId + " lunch " + slate.lunchId + " dinner " + slate.dinnerId);
											                appendFood(loadSlatesCallback, 0, 1, slate);
											            //}, errorHandler);
														} // end function trx result
												); //end trx sql
											}	//end function trx		
									);	//end system trx
								}	// end no rows found block
							}	// end function trx
					);	// end trx sql
			}	//end function trx
		);	// end systemDB trx
			//return id;
	}


function displayerrormessage(transaction, error) {
	alert('Error:  '+error.message+' has occurred with Code: '+error.code);
	return true;
}

//called when page wraps...
function getSlateView(offset, mealName) {
	var plateStyle = 'style="font-family: Chalkduster, sans-serif; color: ' + makeColor(color) + '; font-size: 150%; font-weight: bold;"';	
	//e.g. for offset 0 = 100, 1 = 101, -1 = 99
	var thresholdOffset = offset + slateOffsetThreshold;
    var dow;
    if (thresholdOffset == slateOffsetThreshold)
    	dow = "Today";
    else if (thresholdOffset - slateOffsetThreshold == 1)
    	dow = "Tomorrow";
    else if (thresholdOffset - slateOffsetThreshold == -1)
    	//dow = "Yesterday";
    	dow = "Prior Slate";
    else if (thresholdOffset - slateOffsetThreshold > 0)
    	//dow = offset + " days from now";
    	dow = offset.toString() + " days from now";
    else
    	//dow = (Math.abs(offset)).toString() + " days ago";
    	dow = (Math.abs(offset)).toString() + " slates ago";
    //alert("getSlateView color " + color + " offset " + offset + " dow " + dow + " mealName " + mealName);
    //alert("getSlateView color " + color + " offset " + offset + " dow " + dow + " mealName " + mealName + " slates.length " + slates.length);

    //tjs 110712
    var slate;
    var plateDescription;
    var html;
    //var slateExists = false;
    var slateRandomlyGenerated = false;
    // tjs 110818
    var plateType;
	// tjs 120119
	var breakfastPortions;
	var lunchPortions;
	var dinnerPortions;    		
   
    //alert("plateslate getSlateView offset " + offset + " thresholdOffset " + thresholdOffset + " slates len " + slates.length + " dow " + dow);
    if (slates.length == 0) {
        var nextDate = new Date();
        var nextDateWeekdayName = weekday[nextDate.getDay()];
       	breakfastPlate = getRandomPlate("Breakfast", thresholdOffset);
		lunchPlate = getRandomPlate("Lunch", thresholdOffset);
		dinnerPlate = getRandomPlate("Dinner", thresholdOffset);
		//alert("plateslate getSlateView breakfastPlate.id " + breakfastPlate.id + " lunchPlate.id " + lunchPlate.id + " dinnerPlate.id " + dinnerPlate.id);
		// tjs 120119
		breakfastPortions = getPlatePortions(breakfastPlate);
		lunchPortions = getPlatePortions(lunchPlate);
		dinnerPortions = getPlatePortions(dinnerPlate);    		
		slate = new Slate(0, thresholdOffset, nextDate, nextDate.toLocaleDateString(), nextDateWeekdayName, breakfastPlate.id, lunchPlate.id, dinnerPlate.id, breakfastPortions, lunchPortions, dinnerPortions, 0);
		//slate = new Slate(0, thresholdOffset, nextDate, nextDate.toLocaleDateString(), nextDateWeekdayName, breakfastPlate.id, lunchPlate.id, dinnerPlate.id, null, null, null, 0);
		slates[thresholdOffset] = slate;
   		addToSlate(slate);
    	//alert("plateslate getSlateView (zero length) thresholdOffset " + thresholdOffset + " slate name " + slate.name + " id " + slate.id); 
   		// tjs 120119
		slateRandomlyGenerated = true;
   	}
    if (typeof(slates[thresholdOffset]) === 'undefined') {
        //alert("plateslate getSlateView undefined offset " + offset + " thresholdOffset " + thresholdOffset + " slates len " + slates.length + " dow " + dow);
    	// too far into past...
    	if (thresholdOffset - slateOffsetThreshold < 0) {
            var name = 'NO MORE PRIOR SLATES!';
        	html = '<ul data-role="listview" data-divider-theme="b">';
         	html += '<li data-role="list-divider">';
        	html += dow + ' <p class="ui-li-aside"><strong>' + name + '</strong></p></li>';
        	html += '<li>No Meals Were Planned for this Day!</li>';
         	//alert("plateslate getSlateView offset " + offset + " html " + html);        	
        } else {
        	// new territory for slate in future...
        	var priorOffset = offset - 1;
        	//alert("plateslate getSlateView priorOffset " + priorOffset + " slates.length " + slates.length);
        	var nextDateMillis;
         	if (slates.length > 0) {
	        	slate = slates[priorOffset + slateOffsetThreshold];
	        	//alert("plateslate getSlateView priorOffset " + priorOffset + " slate name " + slate.name + " id " + slate.id);        	
	            var priorDate = slate.date;
	        	//alert("plateslate getSlateView priorOffset " + priorOffset + " slate name " + slate.name + " id " + slate.id + " priorDate name " + priorDate.toLocaleString());        	
	            var priorDateName = priorDate.toLocaleString();
	        	//alert("plateslate getSlateView priorOffset " + priorOffset + " slate name " + slate.name + " id " + slate.id + " priorDate name " + priorDateName);
	        	priorDate = new Date(priorDateName);
	            var priorDateMillis = priorDate.getTime();
	           	//alert("plateslate getSlateView priorDateMillis " + priorDateMillis);        	
	            nextDateMillis = priorDateMillis + 24*60*60*1000;
	           	//alert("plateslate getSlateView priorDateMillis " + priorDateMillis + " nextDateMillis " + nextDateMillis);        	
		        //alert("plateslate getSlateView priorOffset " + priorOffset + " slate name " + slate.name + " id " + slate.id);
        	} else {
        		nextDateMillis = 0;
        	}
	        var nextDate = new Date();
	        if (nextDateMillis > 0) {
	        	nextDate.setTime(nextDateMillis);
	        }	        
	        nextDate.setHours(0, 0, 0, 0);
	        var nextDateWeekdayName = weekday[nextDate.getDay()];
	        //alert("plateslate getSlateView priorOffset " + priorOffset + " nextDate name " + nextDate.toLocaleString());
        	breakfastPlate = getRandomPlate("Breakfast", thresholdOffset);
    		lunchPlate = getRandomPlate("Lunch", thresholdOffset);
    		dinnerPlate = getRandomPlate("Dinner", thresholdOffset);
    		//alert("plateslate getSlateView breakfastPlate.id " + breakfastPlate.id + " lunchPlate.id " + lunchPlate.id + " dinnerPlate.id " + dinnerPlate.id);
    		// tjs 120119
    		breakfastPortions = getPlatePortions(breakfastPlate);
    		lunchPortions = getPlatePortions(lunchPlate);
    		dinnerPortions = getPlatePortions(dinnerPlate);    		
    		slate = new Slate(0, thresholdOffset, nextDate, nextDate.toLocaleDateString(), nextDateWeekdayName, breakfastPlate.id, lunchPlate.id, dinnerPlate.id, breakfastPortions, lunchPortions, dinnerPortions, 0);
    		//insert the new slate...
    		slates[thresholdOffset] = slate;
    		addToSlate(slate);
    		slateRandomlyGenerated = true;
        	//alert("plateslate getSlateView (undefined) thresholdOffset " + thresholdOffset + " slate name " + slate.name + " id " + slate.id); 
        }
    }
    
    if (typeof(slates[thresholdOffset]) !== 'undefined') {
        //alert("plateslate getSlateView defined offset " + offset + " thresholdOffset " + thresholdOffset + " slates len " + slates.length + " dow " + dow);
    	slate = slates[thresholdOffset];
    	
    	// tjs 120119
    	if (slateRandomlyGenerated) {
    		addToFood(slate);
    	}
    	
    	//viewSlate("GETSLATEVIEW", slate);
        var name = slate.name;
    	html = '<ul data-role="listview" data-divider-theme="b">';
     	html += '<li data-role="list-divider">' + dow + ' <p class="ui-li-aside"><strong>' + name + '</strong></p></li>';
        if (mealName == "Breakfast") {
	        var plate = plates[slate.breakfastId];
	        plateDescription = plate.description;
	        if (plateDescription.length == 0 || plateDescription == null)
	        	plateDescription = "starter choice!";
	        plateSelectionsHtml = getPlateSelections(slate, plate, thresholdOffset, slateRandomlyGenerated);
	    	//alert("plateslate getSlateView plate name " + plate.name);
	        plateType = "'Breakfast'";
        } else if (mealName == "Lunch") {
	        plate = plates[slate.lunchId];
	        plateDescription = plate.description;
	        if (plateDescription.length == 0 || plateDescription == null)
	        	plateDescription = "midday milestone!";
	        plateSelectionsHtml = getPlateSelections(slate, plate, thresholdOffset, slateRandomlyGenerated);
	        plateType = "'Lunch'";
        } else if (mealName == "Dinner") {
	        plate = plates[slate.dinnerId];
	        plateDescription = plate.description;
	    	//alert("plateslate getSlateView offset " + offset + " plateDescription " + plateDescription);
	        if (plateDescription.length == 0 || plateDescription == null)
	        	plateDescription = "main entree!";
	        plateSelectionsHtml = getPlateSelections(slate, plate, thresholdOffset, slateRandomlyGenerated);
	        plateType = "'Dinner'";
        }
     	html += '<li data-role="list-divider">' + plateSelectionsHtml + ' <p class="ui-li-aside"><span ' + plateStyle + '>' + plateDescription + '</span></p></li>';
    	var grainDeferred = plateGrainsHtml == '<li/>';
    	var proteinDeferred = plateProteinHtml == '<li/>';
    	var vegetablesDeferred = plateVegetablesHtml == '<li/>';
    	var fruitsDeferred = plateFruitsHtml == '<li/>';
    	var dairyDeferred = plateDairyHtml == '<li/>';
    	// first obtain non-empty portions of the meal
    	if (!grainDeferred) {
    		html += getGrainMealHtml(offset, mealName);
    	}
    	if (!proteinDeferred) {
    		html += getProteinMealHtml(offset, mealName);
    	}
    	if (!vegetablesDeferred) {
    		html += getVegetablesMealHtml(offset, mealName);
    	}
    	if (!fruitsDeferred) {
    		html += getFruitsMealHtml(offset, mealName);
    	}
    	if (!dairyDeferred) {
    		html += getDairyMealHtml(offset, mealName);
    	}
    	// else some are deferred since they are empty...
    	if (grainDeferred) {
    		html += getGrainMealHtml(offset, mealName);
    	}
    	if (proteinDeferred) {
    		html += getProteinMealHtml(offset, mealName);
    	}
    	if (vegetablesDeferred) {
    		html += getVegetablesMealHtml(offset, mealName);
    	}
    	if (fruitsDeferred) {
    		html += getFruitsMealHtml(offset, mealName);
    	}
    	if (dairyDeferred) {
    		html += getDairyMealHtml(offset, mealName);
    	}
    	//alert("plateslate getSlateView offset " + offset + " mealName " + mealName + " html " + html);
    } 
    html += '</ul>';    
	//alert("plateslate getSlateView offset " + offset + " mealName " + mealName + " html " + html);
    return html;
}

function getGrainMealHtml(offset, mealName) {
	var newGrainHtml = getPortionSelections(offset , mealName, "Grain");
	//alert("plateSlateCellApp getGrainMealHtml newGrainHtml " + newGrainHtml);
	var html = '<li data-role="list-divider" data-theme="b">' + newGrainHtml + ' <p class="ui-li-aside dividerIcon"><strong>+ Grain</strong></p></li>';
	html += plateGrainsHtml;
	return html;
}

function getProteinMealHtml(offset, mealName) {
	var newProteinHtml = getPortionSelections(offset , mealName, "Protein");
	var html = '<li data-role="list-divider" data-theme="b">' + newProteinHtml + ' <p class="ui-li-aside dividerIcon"><strong>+ Protein</strong></p></li>';
	html += plateProteinHtml;
	return html;
}

function getVegetablesMealHtml(offset, mealName) {
	var newVegetablesHtml = getPortionSelections(offset , mealName, "Vegetables");
	var html = '<li data-role="list-divider" data-theme="b">' + newVegetablesHtml + ' <p class="ui-li-aside dividerIcon"><strong>+ Vegetable</strong></p></li>';
	html += plateVegetablesHtml;
	return html;
}

function getFruitsMealHtml(offset, mealName) {
	var newFruitsHtml = getPortionSelections(offset , mealName, "Fruits");
	var html = '<li data-role="list-divider" data-theme="b">' + newFruitsHtml + ' <p class="ui-li-aside dividerIcon"><strong>+ Fruit</strong></p></li>';
	html += plateFruitsHtml;
	return html;
}

function getDairyMealHtml(offset, mealName) {
	var newDairyHtml = getPortionSelections(offset , mealName, "Dairy");
	var html = '<li data-role="list-divider" data-theme="b">' + newDairyHtml + ' <p class="ui-li-aside dividerIcon"><strong>+ Dairy</strong></p></li>';
	html += plateDairyHtml;
	return html;
}

function getRandomPlate(plateType, offset) {
	var len = plates.length;
	//alert("plateslate getRandomPlate len " + len + " plateType " + plateType);
	var breakfastLen = 0;
	var lunchLen = 0;
	var dinnerLen = 0;
	var typeLen = 0;
	var plate;
	var selectedPlate = null;
	for (var i = 0; i < len; i++) {
		//alert("plateslate getRandomPlate i " + i);
	    if (typeof(plates[i]) === 'undefined')
	    	continue;
		plate = plates[i];
		if (plate != null) {
			//TODO if (plate.master == 1)
				//alert("plateslate getRandomPlate plate.type " + plate.type + " plate.name " + plate.name + " index " + i);
			if (plate.type == plateType) {
				typeLen++;
			}
		} else {
			//alert("plateslate getRandomPlate null plate at index " + i);
		}
	}

	//TODO consider offset for uniqueness
	var html = '<select id="' + plateType + '_' + offset + '"><optgroup label="' + plateType + '">';
	if (typeLen > 0) {
		//return a random integer between 0 and typeLen
		var selectedOption = Math.floor(Math.random()*(typeLen - 1));
		var offset = 0;
		for (var i = 0; i < len; i++) {
			//alert("plateslate populatePlateMenus i " + i);
		    if (typeof(plates[i]) === 'undefined')
		    	continue;
			plate = plates[i];
			if (plate != null) {
				//TODO if (plate.master == 1)
				//alert("plateslate populatePlateMenus plate.type " + plate.type + " plate.name " + plate.name);
				if (plate.type == plateType) {
					html += '<option value ="' + plate.id +'"';
					if (offset == selectedOption) {
						html += ' selected="selected" ';
						selectedPlate = plate;
					}
					html += '>' + plate.name + '</option>';
					offset++;
				}
			}
		}
		plateSelectionsHtml = html + '</optgroup></select>';
		//alert("plateslate getRandomPlate plateSelectionsHtml " + plateSelectionsHtml);
	}
	//alert("plateslate getRandomPlate selectedOption " + selectedOption + " typeLen " + typeLen + " plateSelectionsHtml " + plateSelectionsHtml);
	return selectedPlate;
}

function getPlatePortions(plate) {
	var typePortions = new Array();
	var portionId;
	for (var i = 0; i < 9; i++) {
			//alert("plateslate updatePlate input element name " + inputElm.name + " value of id " + inputElm.value);
			switch (i) {
			case 0:
				portionId = plate.portion1;
				if (portionId != null && portionId > 0)
			    	//typePortions.push(portions[portionId]);
			    	typePortions.push(portionId);
				break;
				
			case 1:
				portionId = plate.portion2;
				if (portionId != null && portionId > 0)
			    	typePortions.push(portionId);
				break;
				
			case 2:
				portionId = plate.portion3;
				if (portionId != null && portionId > 0)
			    	typePortions.push(portionId);
				break;
				
			case 3:
				portionId = plate.portion4;
				if (portionId != null && portionId > 0)
			    	typePortions.push(portionId);
				break;
				
			case 4:
				portionId = plate.portion5;
				if (portionId != null && portionId > 0)
			    	typePortions.push(portionId);
				break;
				
			case 5:
				portionId = plate.portion6;
				if (portionId != null && portionId > 0)
			    	typePortions.push(portionId);
				break;
				
			case 6:
				portionId = plate.portion7;
				if (portionId != null && portionId > 0)
			    	typePortions.push(portionId);
				break;
				
			case 7:
				portionId = plate.portion8;
				if (portionId != null && portionId > 0)
			    	typePortions.push(portionId);
				break;
				
			case 8:
				portionId = plate.portion9;
				if (portionId != null && portionId > 0)
			    	typePortions.push(portionId);
				break;
			
				default:
					break;
			}
		//must ensure row exists and is active
	}
	return typePortions;
}

function getPlateSelections(slate, plate, offset, slateRandomlyGenerated) {
	var len = plates.length;
	//alert("plateslate getPlateSelections len " + len + " slate id" + slate.id + " plateType " + plate.type + " offset " + offset);
	// tjs 120228
	//var breakfastLen = 0;
	//var lunchLen = 0;
	//var dinnerLen = 0;
	var typeLen = 0;
		plateGrainsHtml = '<li/>';
		plateProteinHtml = '<li/>';
		plateVegetablesHtml = '<li/>';
		plateFruitsHtml = '<li/>';
		plateDairyHtml = '<li/>';
	
	var currentPlate;
	var plateType = plate.type;
	var id = plate.id;
	
	var selectedPlate = null;
	for (var i = 0; i < len; i++) {
	    if (i in plates) {
	    	currentPlate = plates[i];
			if (currentPlate != null) {
				//TODO if (currentPlate.master == 1)
					//alert("plateslate getRandomPlate plate.type " + plate.type + " plate.name " + plate.name + " index " + i);
				if (currentPlate.type == plateType) {
					typeLen++;
				}
			}
		}
		/*
		//alert("plateslate getRandomPlate i " + i);
	    if (typeof(plates[i]) === 'undefined')
	    	continue;
	    currentPlate = plates[i];
		if (currentPlate != null) {
			//TODO if (currentPlate.master == 1)
				//alert("plateslate getRandomPlate plate.type " + plate.type + " plate.name " + plate.name + " index " + i);
			if (currentPlate.type == plateType) {
				typeLen++;
			}
		} else {
			//alert("plateslate getPlateSelections null plate at index " + i);
		}
		*/
	}

	//TODO consider offset for uniqueness
	var html = '<select class="' + plateType + '"><optgroup label="' + plateType + '">';
	if (typeLen > 0) {
		//return a random integer between 0 and typeLen
		for (var i = 0; i < len; i++) {
		    if (i in plates) {
		    	currentPlate = plates[i];
				if (currentPlate != null) {
					//TODO if (currentPlate.master == 1)
						//alert("plateslate getRandomPlate plate.type " + plate.type + " plate.name " + plate.name + " index " + i);
					if (currentPlate.type == plateType) {
						if (id == currentPlate.id) {
							html += '<option value ="' + currentPlate.id +'"';
							html += ' selected="selected" ';
							html += '>' + currentPlate.name + '</option>';
						} else if (currentPlate.isInactive != 1) {
							html += '<option value ="' + currentPlate.id +'"';
							html += '>' + currentPlate.name + '</option>';
						}
					}
				}
			}
		}
		/*
		var offset = 0;
		for (var i = 0; i < len; i++) {
			//alert("plateslate populatePlateMenus i " + i);
		    if (typeof(plates[i]) === 'undefined')
		    	continue;
		    currentPlate = plates[i];
			if (currentPlate != null) {
				//TODO if (currentPlate.master == 1)
				//alert("plateslate getPlateSelections plate.type " + plate.type + " plate.name " + plate.name);
				if (currentPlate.type == plateType) {
					html += '<option value ="' + currentPlate.id +'"';
					if (id == currentPlate.id) {
						html += ' selected="selected" ';
					}
					html += '>' + currentPlate.name + '</option>';
					offset++;
				}
			}
		}*/
		var plateSelectionsHtml = html + '</optgroup></select>';
		//alert("plateslate getPlateSelections plateSelectionsHtml " + plateSelectionsHtml);
			getFoodPortions(slate, plate);
		//alert("plateslate getPlateSelections plateGrainsHtml " + plateGrainsHtml + " plateProteinHtml " + plateProteinHtml);		
	}
	//alert("plateslate getRandomPlate selectedOption " + selectedOption + " typeLen " + typeLen + " plateSelectionsHtml " + plateSelectionsHtml);
	return plateSelectionsHtml;
}

function getTestPlateSelections(slate, plate, offset) {
	var len = plates.length;
	//alert("plateslate getPlateSelections len " + len + " slate id" + slate.id + " plateType " + plate.type + " offset " + offset);
	var breakfastLen = 0;
	var lunchLen = 0;
	var dinnerLen = 0;
	var typeLen = 0;
	
	plateGrainsHtml = '<li/>';
	plateProteinHtml = '<li/>';
	plateVegetablesHtml = '<li/>';
	plateFruitsHtml = '<li/>';
	plateDairyHtml = '<li/>';
	
	var currentPlate;
	var plateType = plate.type;
	var id = plate.id;
	
	var selectedPlate = null;
	for (var i = 0; i < len; i++) {
		//alert("plateslate getRandomPlate i " + i);
	    if (typeof(plates[i]) === 'undefined')
	    	continue;
	    currentPlate = plates[i];
		if (currentPlate != null) {
			//TODO if (currentPlate.master == 1)
				//alert("plateslate getRandomPlate plate.type " + plate.type + " plate.name " + plate.name + " index " + i);
			if (currentPlate.type == plateType) {
				typeLen++;
			}
		} else {
			//alert("plateslate getPlateSelections null plate at index " + i);
		}
	}

	//TODO consider offset for uniqueness
	var html = '<select id="' + plateType + '_' + offset + '"><optgroup label="' + plateType + '">';
	if (typeLen > 0) {
		//return a random integer between 0 and typeLen
		var offset = 0;
		for (var i = 0; i < len; i++) {
			//alert("plateslate populatePlateMenus i " + i);
		    if (typeof(plates[i]) === 'undefined')
		    	continue;
		    currentPlate = plates[i];
			if (currentPlate != null) {
				//TODO if (currentPlate.master == 1)
				//alert("plateslate getPlateSelections plate.type " + plate.type + " plate.name " + plate.name);
				if (currentPlate.type == plateType) {
					html += '<option value ="' + currentPlate.id +'"';
					if (id == currentPlate.id) {
						html += ' selected="selected" ';
					}
					html += '>' + currentPlate.name + '</option>';
					offset++;
				}
			}
		}
		var plateSelectionsHtml = html + '</optgroup></select>';
		//alert("plateslate getPlateSelections plateSelectionsHtml " + plateSelectionsHtml);
		//alert("plateslate getPlateSelections plateGrainsHtml " + plateGrainsHtml + " plateProteinHtml " + plateProteinHtml);		
	}
	//alert("plateslate getRandomPlate selectedOption " + selectedOption + " typeLen " + typeLen + " plateSelectionsHtml " + plateSelectionsHtml);
	return plateSelectionsHtml;
}

// tjs 120227
// used when user choice is 'Slates'
function getPortionSelections(offset, mealName, portionType) {
	// tjs 120111
	// consider that the slate already has portions assigned...
	var thresholdOffset = offset + slateOffsetThreshold;
	// tjs 120116
	//var foodPortions = getMealFoodPortions(thresholdOffset, mealName);
	
	var slate = slates[thresholdOffset];
	var foodPortions;
	if (mealName == "Breakfast") {
		foodPortions = slate.breakfastPortions;
	}  else if (mealName == "Lunch") {
		foodPortions = slate.lunchPortions;
	}  else if (mealName == "Dinner") {
		foodPortions = slate.dinnerPortions;
	}
	
	//alert("plateSlateCellApp getPortionSelections offset " + offset + " mealName " + mealName);
	portionSelectionsHtml = '<select name="portionSelection" class="' + portionType + '" onchange="javascript:processAddNewPortion(' + offset  + ', ' + "'" + mealName + "'" + ', ' + "'" + portionType + "', " + 'this.options[this.selectedIndex].value);"><optgroup label="' + portionType + '">';
	var len = portions.length;
	//alert("plateSlateCellApp newGrainSelectionHtml len " + len);
	if (len > 0) {
		// tjs 120227
		for (var i = 0; i < len; i++) {
			if (i in portions) {
				var currentPortion = portions[i];
				if (currentPortion != null) {
					//TODO if (currentPlate.master == 1)
					//alert("plateslate updatePortionsDialogs portion type " + currentPortion.type + " portion name " + currentPortion.name);
					if (currentPortion.type == portionType) {
						if (!isPortionSelected(currentPortion.id, foodPortions)) {
							// tjs 120227 - ensure inactives are concealed
							if (currentPortion.isInactive != 1) {
								portionSelectionsHtml += '<option value ="' + currentPortion.id + '">' + currentPortion.name + '</option>';
							}
						}
					}
				}
			}
		}
		
		/*
		//var offset = 0;
		for (var i = 0; i < len; i++) {
			//alert("plateslate populatePlateMenus i " + i);
			var currentPortion = portions[i];
			if (currentPortion != null) {
				//TODO if (currentPlate.master == 1)
				//alert("plateslate updatePortionsDialogs portion type " + currentPortion.type + " portion name " + currentPortion.name);
				if (currentPortion.type == portionType) {
					if (!isPortionSelected(currentPortion.id, foodPortions)) {
						portionSelectionsHtml += '<option value ="' + currentPortion.id + '">' + currentPortion.name + '</option>';
					}
				}
			}
		}
		*/
		portionSelectionsHtml += '</optgroup></select>';
	}
	//alert("plateslate newGrainSelectionHtml offset " + offset + " mealName " + mealName + " grainPortionSelectListHtml " + grainPortionSelectListHtml);
	return portionSelectionsHtml;
}

// tjs 120116
/* tjs 120117
function getMealFoodPortions(thresholdOffset, mealName) {
	var slate = slates[thresholdOffset];
	var foodPortions;
	if (mealName == "Breakfast") {
		foodPortions = slate.breakfastPortions;
	}  else if (mealName == "Lunch") {
		foodPortions = slate.lunchPortions;
	}  else if (mealName == "Dinner") {
		foodPortions = slate.dinnerPortions;
	}
	return foodPortions;
}*/

function isPortionSelected(portionId, foodPortions) {
	var torf = false;
	for (var i = 0; i < foodPortions.length; i++) {
		if (portionId == foodPortions[i]) {
			torf = true;
			break;
		}
	}
	return torf;
}

function appendPortion(plate, portionId, plateIndex, slateTorf) {
	//alert("plateslate appendPortion portionId " + portionId);
	var chalkColor = 0;
	if (slateTorf) {
		chalkColor = makeColor(color);
	}
		
	if (!isNaN(portionId)) {
		if (portionId == 0)
			return;
		
		var portion = portions[portionId];
		//e.g. Grain, Protein, Vegetables, Fruits, Dairy
		var type = portion.type;
		//alert("plateslate appendPortion portionId " + portionId + " type " + type);
		if (type == 'Grain') {
			if (plateGrainsHtml == '<li/>') {
				// c too light, b same as divider, a is black
				plateGrainsHtml = '<li class="grainPortion"><a href="javascript:dropPortion(' + plateIndex + ", '" + plate.type + "', " + portionId + ');" data-role="button" data-icon="delete" data-iconpos="right" data-theme="a"><span class="chalk"';
				if (slateTorf) {
					plateGrainsHtml += ' style="color:' + chalkColor + '"';
				}
				plateGrainsHtml += '>' + portion.name + '</span></a></li>';
			} else {
				plateGrainsHtml += '<li class="grainPortion"><a href="javascript:dropPortion(' + plateIndex + ", '" + plate.type + "', " + portionId + ');" data-role="button" data-icon="delete" data-iconpos="right" data-theme="a"><span class="chalk"';
				if (slateTorf) {
					plateGrainsHtml += ' style="color:' + chalkColor + '"';
				}
				plateGrainsHtml += '>' + portion.name + '</span></a></li>';
			}
		} else if (type == 'Protein') {
			if (plateProteinHtml == '<li/>') {
				plateProteinHtml = '<li class="proteinPortion"><a href="javascript:dropPortion(' + plateIndex + ", '" + plate.type + "', " + portionId + ');" data-role="button" data-icon="delete" data-iconpos="right" data-theme="a"><span class="chalk"';
				if (slateTorf) {
					plateProteinHtml += ' style="color:' + chalkColor + '"';
				}
				plateProteinHtml += '>' + portion.name + '</span></a></li>';
			} else {
				plateProteinHtml += '<li class="proteinPortion"><a href="javascript:dropPortion(' + plateIndex + ", '" + plate.type + "', " + portionId + ');" data-role="button" data-icon="delete" data-iconpos="right" data-theme="a"><span class="chalk"';
				if (slateTorf) {
					plateProteinHtml += ' style="color:' + chalkColor + '"';
				}
				plateProteinHtml += '>' + portion.name + '</span></a></li>';
			}
		} else if (type == 'Vegetables') {
			if (plateVegetablesHtml == '<li/>') {
				plateVegetablesHtml = '<li class="vegetablesPortion"><a href="javascript:dropPortion(' + plateIndex + ", '" + plate.type + "', " + portionId + ');" data-role="button" data-icon="delete" data-iconpos="right" data-theme="a"><span class="chalk"';
				if (slateTorf) {
					plateVegetablesHtml += ' style="color:' + chalkColor + '"';
				}
				plateVegetablesHtml += '>' + portion.name + '</span></a></li>';
			} else {
				plateVegetablesHtml += '<li class="vegetablesPortion"><a href="javascript:dropPortion(' + plateIndex + ", '" + plate.type + "', " + portionId + ');" data-role="button" data-icon="delete" data-iconpos="right" data-theme="a"><span class="chalk"';
				if (slateTorf) {
					plateVegetablesHtml += ' style="color:' + chalkColor + '"';
				}
				plateVegetablesHtml += '>' + portion.name + '</span></a></li>';
			}
		} else if (type == 'Fruits') {
			if (plateFruitsHtml == '<li/>') {
				plateFruitsHtml = '<li class="fruitsPortion"><a href="javascript:dropPortion(' + plateIndex + ", '" + plate.type + "', " + portionId + ');" data-role="button" data-icon="delete" data-iconpos="right" data-theme="a"><span class="chalk"';
				if (slateTorf) {
					plateFruitsHtml += ' style="color:' + chalkColor + '"';
				}
				plateFruitsHtml += '>' + portion.name + '</span></a></li>';
			} else {
				plateFruitsHtml += '<li class="fruitsPortion"><a href="javascript:dropPortion(' + plateIndex + ", '" + plate.type + "', " + portionId + ');" data-role="button" data-icon="delete" data-iconpos="right" data-theme="a"><span class="chalk"';
				if (slateTorf) {
					plateFruitsHtml += ' style="color:' + chalkColor + '"';
				}
				plateFruitsHtml += '>' + portion.name + '</span></a></li>';
			}
		} else if (type == 'Dairy') {
			if (plateDairyHtml == '<li/>') {
				plateDairyHtml = '<li class="dairyPortion"><a href="javascript:dropPortion(' + plateIndex + ", '" + plate.type + "', " + portionId + ');" data-role="button" data-icon="delete" data-iconpos="right" data-theme="a"><span class="chalk"';
				if (slateTorf) {
					plateDairyHtml += ' style="color:' + chalkColor + '"';
				}
				plateDairyHtml += '>' + portion.name + '</span></a></li>';
			} else {
				plateDairyHtml += '<li class="dairyPortion"><a href="javascript:dropPortion(' + plateIndex + ", '" + plate.type + "', " + portionId + ');" data-role="button" data-icon="delete" data-iconpos="right" data-theme="a"><span class="chalk"';
				if (slateTorf) {
					plateDairyHtml += ' style="color:' + chalkColor + '"';
				}
				plateDairyHtml += '>' + portion.name + '</span></a></li>';
			}
		}
		//alert("plateslate appendPortion portionId " + portionId + " type " + type + " plateGrainsHtml " + plateGrainsHtml);
	}
}

function updateSlate(offset) {
	var thresholdOffset = offset + slateOffsetThreshold;
	//alert( "plateslate updateSlate thresholdOffset " + thresholdOffset + " offset " + offset);
    if (typeof(slates[thresholdOffset]) !== 'undefined') {
    	var slate = slates[thresholdOffset];
    	//alert( "plateslate updateSlate thresholdOffset " + thresholdOffset + " name " + slate.name + " breakfast " + slate.breakfastId);
    	addToSlate(slate);
   }
}

// tjs 120213 deprecated!!!
function populateSlate() {
	view = new PageView(wrap);
}

function compareTimes(a, b) {
	return a.time - b.time;
}

function processPlateEdit(slateId, plate, typePortions, override) {
	//alert( "plateslate processPlateEdit...");
	//alert( "plateslate processPlateEdit name " + plate.name + " id " + plate.id + " portion1 " + plate.portion1 + " portion2 " + plate.portion2 + " portion3 " + plate.portion3);
	//alert( "plateslate processPlateEdit name " + plate.name + " id " + plate.id + " slateId " + slateId + " typePortions.length " + typePortions.length + " override " + override);
	if (override) {
		plate.portion1 = 0;
		plate.portion2 = 0;
		plate.portion3 = 0;
		plate.portion4 = 0;
		plate.portion5 = 0;
		plate.portion6 = 0;
		plate.portion7 = 0;
		plate.portion8 = 0;
		plate.portion9 = 0;
	}

	//alert( "plateslate processPlateEdit clear typePortions...");
	// refresh cache...
	// tjs 120119
    //if (typeof(typePortions !== 'undefined')) {
    if (typeof(typePortions) !== 'undefined') {
    	if (typePortions.length > 0) {
    		//alert( "plateslate processPlateEdit typePortions.length " + typePortions.length);
    		typePortions.length = 0;
    		//alert( "plateslate processPlateEdit cleared typePortions.length " + typePortions.length);
    	}
    }

	//alert( "plateslate processPlateEdit call deactivateFoodPortions slateId " + slateId + " plate.type " + plate.type);
	var portionsChecked = $("#plateEditDialog input:checked");
	var len = portionsChecked.length;
	var portion;
	for (var i = 0; i < len; i++) {
		var inputElm = portionsChecked[i];
		portion = inputElm.value;
		// continue refresh of cache...
	    //if (typeof(typePortions !== 'undefined')) {
	    if (typeof(typePortions) !== 'undefined') {
	    	typePortions.push(portion);
	    }		
		if (override) {
			//alert("plateslate updatePlate input element name " + inputElm.name + " value of id " + inputElm.value);
			switch (i) {
			case 0:
					plate.portion1 = portion;
				break;
				
			case 1:
				plate.portion2 = portion;
				break;
				
			case 2:
				plate.portion3 = portion;
				break;
				
			case 3:
				plate.portion4 = portion;
				break;
				
			case 4:
				plate.portion5 = portion;
				break;
				
			case 5:
				plate.portion6 = portion;
				break;
				
			case 6:
				plate.portion7 = portion;
				break;
				
			case 7:
				plate.portion8 = portion;
				break;
				
			case 8:
				plate.portion9 = portion;
				break;
			
				default:
					break;
			}
		}
		//must ensure row exists and is active
		updateFood(slateId, plate.type, portion, 0, 0);
	}
	deactivateFoodComplement(slateId, plate.type, typePortions);
	
	//alert( "plateslate processPlateEdit updated name " + plate.name + " id " + plate.id + " portion1 " + plate.portion1 + " portion2 " + plate.portion2 + " portion3 " + plate.portion3);
	if (override) {
		var id = plate.id;
		//update cache
		plates[id] = plate;
		//persist cache
		addToPlate(plate);
	}
	$("#plateEditDialog").dialog("close");
	
	view.sendEvent();
}

function addToFood(slate) {
	//("plateslate addToFood slate id " + slate.id);
	
	var id = 0;
	systemDB.transaction(
		function(transaction) {
			transaction.executeSql(
			//'SELECT cart_sess, cart_sku,  cart_item_name, cart_qty, cart_price FROM shopcart where cart_sess=? and cart_sku=?;',[sid, sku],
					'SELECT id, slate, type, portion, master, isInactive FROM food where slate=?;',[slate.id],

			function (transaction, result) {
			if (result.rows.length >0) {
				var breakfastPortions = new Array();
				var lunchPortions = new Array();
				var dinnerPortions = new Array();
				
				//alert("plateslate addToFood result.rows.length " + result.rows.length);
				for (var i = 0; i < result.rows.length; i++) {
					var row = result.rows.item(i);
					var type = row.type;
					var portion = row.portion;
					//alert("plateslate addToFood type " + type + " portion " + portion);
					if (type == "Breakfast") {
						breakfastPortions.push(portion); 
					} else if (type == "Lunch") {
						lunchPortions.push(portion); 
					} else if (type == "Dinner") {
						dinnerPortions.push(portion); 
					}
				}
				//alert("plateslate addToFood breakfastPortions len " + breakfastPortions.length + " lunchPortions len  " + lunchPortions.length);
				slate.breakfastPortions = breakfastPortions.slice(0);
				slate.lunchPortions = lunchPortions.slice(0);
				slate.dinnerPortions = dinnerPortions.slice(0);
			} else {
				var plateId = slate.breakfastId;
				//alert("plateslate addToFood plate id " + plateId);
				var plate = plates[plateId];
				insertFood(slate, plate);
				plateId = slate.lunchId;
				plate = plates[plateId];
				insertFood(slate, plate);
				plateId = slate.dinnerId;
				plate = plates[plateId];
				insertFood(slate, plate);
				//alert("plateslate addToPlate inserting: type " + plate.type + " name " + plate.name + " desc " + plate.description + " master " + plate.master + " isInactive? " + plate.isInactive + " portion #1 " + plate.portion1);
			}
		}
		);
	}
	);
}

function appendFood(loadSlatesCallback, count, length, slate) {
	if (slate.id == 0) {
		alert("plateslate appendFood slate id is zero!");
	}
	//alert("plateslate appendFood slate id " + slate.id + " breakfastPortions len " + slate.breakfastPortions.length);
	systemDB.transaction(
			function(transaction) {
	
	var id = 0;
			transaction.executeSql(
					'SELECT id, slate, type, portion, master, isInactive FROM food where slate=?;',[slate.id],

			function (transaction, result) {
			if (result.rows.length >0) {
				if (slate.breakfastPortions.length > 0)
					slate.breakfastPortions.length = 0;
				if (slate.lunchPortions.length > 0)
					slate.lunchPortions.length = 0;
				if (slate.dinnerPortions.length > 0)
					slate.dinnerPortions.length = 0;
				
				//alert("plateslate appendFood result.rows.length " + result.rows.length);
				for (var i = 0; i < result.rows.length; i++) {
					var row = result.rows.item(i);
					var isInactive = row.isInactive;
					if (isInactive > 0)
						continue;
					var type = row.type;
					var portion = row.portion;
					//alert("plateslate appendFood type " + type + " portion " + portion + " breakfastPortions len " + slate.breakfastPortions.length);
					if (type == "Breakfast") {
						slate.breakfastPortions.push(portion); 
					} else if (type == "Lunch") {
						slate.lunchPortions.push(portion); 
					} else if (type == "Dinner") {
						slate.dinnerPortions.push(portion); 
					}
				}
				//alert("plateslate appendFood breakfastPortions len " + slate.breakfastPortions.length + " lunchPortions len  " + slate.lunchPortions.length + " dinnerPortions len  " + slate.dinnerPortions.length);
				
				if (length - count == 1) {
					//alert("plateslate appendFood callback breakfastPortions len " + slate.breakfastPortions.length + " lunchPortions len  " + slate.lunchPortions.length + " dinnerPortions len  " + slate.dinnerPortions.length);
					loadSlatesCallback(true);
				}
			} else {
				//				var torf = (length - count == 1);
				var torf = false;
				if (length - count == 1)
					torf = true;
				//alert("plateslate appendFood torf " + torf + " breakfastPortions len " + slate.breakfastPortions.length + " lunchPortions len  " + slate.lunchPortions.length + " dinnerPortions len  " + slate.dinnerPortions.length);
				insertSlateFoods(loadSlatesCallback, torf, slate);
			}
		}
		);
			}
	);
}

function insertFood(slate, plate) {
	
	//alert("plateslate insertFood slate id " + slate.id + " plate id " + plate.id + " plate type " + plate.type);
	var foods = new Array();
	var portionId = plate.portion1;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate getRandomPlate plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
			
	portionId = plate.portion2;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate getRandomPlate plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	//alert("plateslate getRandomPlate portionId #2 " + portionId);
	portionId = plate.portion3;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate getRandomPlate plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	//alert("plateslate getRandomPlate portionId #3 " + portionId);
	portionId = plate.portion4;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate getRandomPlate plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	//alert("plateslate getRandomPlate portionId #4 " + portionId);
	portionId = plate.portion5;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate getRandomPlate plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	//alert("plateslate getRandomPlate portionId #5 " + portionId);
	portionId = plate.portion6;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate getRandomPlate plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	portionId = plate.portion7;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate getRandomPlate plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	portionId = plate.portion8;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate getRandomPlate plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	portionId = plate.portion9;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate getRandomPlate plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	// NB slice forces deep copy...
	if (plate.type == "Breakfast") {
		slate.breakfastPortions = foods.slice(0);
	} else if (plate.type == "Lunch") {
		slate.lunchPortions = foods.slice(0);
	} else if (plate.type == "Dinner") {
		slate.dinnerPortions = foods.slice(0);
	}
}

function insertSlateFood(loadSlatesCallback, torf, slate, plate) {
	
	//alert("plateslate insertSlateFood slate id " + slate.id + " plate id " + plate.id + " plate type " + plate.type);
	var foods = new Array();
	var portionId = plate.portion1;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
			
	portionId = plate.portion2;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	//alert("plateslate insertSlateFood portionId #2 " + portionId);
	portionId = plate.portion3;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	//alert("plateslate insertSlateFood portionId #3 " + portionId);
	portionId = plate.portion4;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	//alert("plateslate insertSlateFood portionId #4 " + portionId);
	portionId = plate.portion5;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	//alert("plateslate getRandomPlate portionId #5 " + portionId);
	portionId = plate.portion6;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	portionId = plate.portion7;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	portionId = plate.portion8;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	portionId = plate.portion9;
	if (!isNaN(portionId)) {
		if (portionId > 0) {
			foods.push(portionId);
			//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
		}
	}
	// NB slice forces deep copy...
	if (plate.type == "Breakfast") {
		//slate.breakfastPortions = foods.slice(0);
		slate.breakfastPortions.length = 0;
		for (var i = 0; i < foods.length; i++ ) {
			slate.breakfastPortions.push(foods[i]);
		}
	} else if (plate.type == "Lunch") {
		//slate.lunchPortions = foods.slice(0);
		slate.lunchPortions.length = 0;
		for (var i = 0; i < foods.length; i++ ) {
			slate.lunchPortions.push(foods[i]);
		}
	} else if (plate.type == "Dinner") {
		//slate.dinnerPortions = foods.slice(0);
		slate.dinnerPortions.length = 0;
		for (var i = 0; i < foods.length; i++ ) {
			slate.dinnerPortions.push(foods[i]);
		}
	}
	//alert("plateslate insertSlateFood breakfastPortions len " + slate.breakfastPortions.length + " lunchPortions len  " + slate.lunchPortions.length + " dinnerPortions len  " + slate.dinnerPortions.length);
	if (torf == true) {
		//alert("plateslate insertSlateFood final breakfastPortions len " + slate.breakfastPortions.length + " lunchPortions len  " + slate.lunchPortions.length + " dinnerPortions len  " + slate.dinnerPortions.length);
		loadSlatesCallback(true);
	}
}

function insertSlateFoods(loadSlatesCallback, torf, slate) {
	
	//alert("plateslate insertSlateFoods slate id " + slate.id + " torf " + torf);
	if (slate.breakfastPortions.length > 0)
		slate.breakfastPortions.length = 0;
	if (slate.lunchPortions.length > 0)
		slate.lunchPortions.length = 0;
	if (slate.dinnerPortions.length > 0)
		slate.dinnerPortions.length = 0;
	var plateId;
	var plate;
	
	for (var i = 0; i < 3; i++) {
		switch (i) {
		case 0:	// breakfast
			plateId = slate.breakfastId;
			break;
			
		case 1:	// lunch
			plateId = slate.lunchId;
			break;

		case 2:	// dinner
			plateId = slate.dinnerId;
			break;
		}
		plate = plates[plateId];
		//alert("plateslate insertSlateFoods slate id " + slate.id + " plate id " + plate.id + " plate type " + plate.type);
		var portionId = plate.portion1;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (i) {
				case 0:	// breakfast
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
				insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
			}
		}
				
		portionId = plate.portion2;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (i) {
				case 0:	// breakfast
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
				insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
			}
		}
		//alert("plateslate insertSlateFood portionId #2 " + portionId);
		portionId = plate.portion3;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (i) {
				case 0:	// breakfast
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
				insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
			}
		}
		//alert("plateslate insertSlateFood portionId #3 " + portionId);
		portionId = plate.portion4;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (i) {
				case 0:	// breakfast
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
				insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
			}
		}
		//alert("plateslate insertSlateFood portionId #4 " + portionId);
		portionId = plate.portion5;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (i) {
				case 0:	// breakfast
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
				insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
			}
		}
		//alert("plateslate getRandomPlate portionId #5 " + portionId);
		portionId = plate.portion6;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				//foods.push(portionId);
				switch (i) {
				case 0:	// breakfast
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
				insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
			}
		}
		portionId = plate.portion7;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (i) {
				case 0:	// breakfast
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
				insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
			}
		}
		portionId = plate.portion8;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (i) {
				case 0:	// breakfast
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
				insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
			}
		}
		portionId = plate.portion9;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (i) {
				case 0:	// breakfast
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
				insertSlateFoodPortion(slate.id, plate.type, portionId, 0);
			}
		}
	}
	//alert("plateslate insertSlateFood breakfastPortions len " + slate.breakfastPortions.length + " lunchPortions len  " + slate.lunchPortions.length + " dinnerPortions len  " + slate.dinnerPortions.length);
	if (torf == true) {
		//alert("plateslate insertSlateFood final breakfastPortions len " + slate.breakfastPortions.length + " lunchPortions len  " + slate.lunchPortions.length + " dinnerPortions len  " + slate.dinnerPortions.length);
		loadSlatesCallback(true);
	}
}

function insertFoodPortion(slateId, type, portionId, master) {
	if (!isNaN(portionId)) {
		if (portionId == 0)
			return;
		if (slateId == 0)
			return;
		//alert("plateslate insertFoodPortion slate id " + slateId + " portion id " + portionId + " plate type " + type);

	systemDB.transaction(
			function(transaction) {
			transaction.executeSql(
			'INSERT INTO food (slate, type,  portion, master, isInactive) VALUES (?,?,?,?,?);',
			[slateId, type, portionId, master, 0],
			function(){
				//alert("plateslate addToPortion added: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
			},
			displayerrormessage
			);
			}
		);
	}
}

function insertSlateFoodPortion(slateId, type, portionId, master) {
		if (!isNaN(portionId)) {
			if (portionId == 0) {
				alert("insertSlateFoodPortion portionId is zero!");
				return;
			}
				
			if (slateId == 0) {
				alert("insertSlateFoodPortion slateId is zero!");
				return;				
			}
			//alert("plateslate insertSlateFoodPortion slate id " + slateId + " portion id " + portionId + " plate type " + type);

			systemDB.transaction(
					function(transaction) {
				transaction.executeSql(
				'INSERT INTO food (slate, type,  portion, master, isInactive) VALUES (?,?,?,?,?);',
				[slateId, type, portionId, master, 0],
				function(){
					//trxDone('add');
					//alert("plateslate addToPortion added: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
				},
				displayerrormessage
				);
		}
			);
		}
	}

function getFoodPortions(slate, plate) {
	//alert("plateslate getFoodPortions slate id " + slate.id + " plate id " + plate.id + " plate type " + plate.type);
	var foodPortions;
	if (plate.type == "Breakfast") {
		// tjs 120117
		//if (typeof(slate.breakfastPortions === 'undefined')) {
			//alert("plateslate getFoodPortions breakfast undefined!");			
		//} 			
		foodPortions = slate.breakfastPortions;
	}  else if (plate.type == "Lunch") {
		foodPortions = slate.lunchPortions;
	}  else if (plate.type == "Dinner") {
		foodPortions = slate.dinnerPortions;
	}
	//alert("plateslate getFoodPortions slate id " + slate.id + " plate id " + plate.id + " plate type " + plate.type + " foodPortions length " + foodPortions.length);
	//alert("plateslate getFoodPortions foodPortions length " + foodPortions.length);
	// tjs 120117
	var portionsAppended = new Array();
	if (foodPortions.length > 0) {
		for (var i = 0; i < foodPortions.length; i++) {
			portionId = foodPortions[i];
			var appended = false;
			for (var j = 0; j < portionsAppended.length; j++) {
				if (portionId == portionsAppended[j]) {
					appended = true;
					break;
				}
			}
			if (!appended) {
				appendPortion(plate, portionId, 0, true);
				portionsAppended.push(portionId);
			}
		}
	} 
	//tjs 110812 rewrite
}

function deactivateFoodPortions(slateId, type) {
	systemDB.transaction(
			function(transaction) {
				transaction.executeSql(
						'SELECT id, slate, type, portion, master, isInactive FROM food where slate=? and type=?;',[slateId, type],

				function (transaction, result) {
				if (result.rows.length >0) {
					for (var i = 0; i < result.rows.length; i++) {
						var row = result.rows.item(i);
						var isInactive=parseInt(row.isInactive);
						//alert("plateslate deactivateFoodPortions isInactive " + isInactive);
						if (isInactive == 1) {
							continue;
						} else {
							var portion = parseInt(row.portion);
							//update this row
							makeFoodPortionInactive(slateId, type, portion);
						}
					}
					//alert("plateslate addToFood result.rows.length " + result.rows.length);
				} else {
					//noop
				}
			}
			);
		}
		);	
}

function deactivateFoodComplement(slateId, type, typePortions) {

	systemDB.transaction(
			function(transaction) {
				transaction.executeSql(
						'SELECT id, slate, type, portion, master, isInactive FROM food where slate=? and type=?;',[slateId, type],

				function (transaction, result) {
				if (result.rows.length >0) {
					for (var i = 0; i < result.rows.length; i++) {
						var row = result.rows.item(i);
						var portion = parseInt(row.portion);
						var torf = false;
						for (var j = 0; j < typePortions.length; j++ ) {
							if (portion == typePortions[j]) {
								torf = true;
								break;
							}
						}
						if (torf)
							continue;
						var isInactive=parseInt(row.isInactive);
						//alert("plateslate deactivateFoodComplement isInactive " + isInactive);
						if (isInactive == 1) {
							continue;
						} else {
							var portion = parseInt(row.portion);
							//update this row
							makeFoodPortionInactive(slateId, type, portion);
						}
					}
					//alert("plateslate addToFood result.rows.length " + result.rows.length);
				} else {
					//noop
				}
			}
			);
		}
		);	
}

function makeFoodPortionInactive(slateId, type, portion) {
	//alert("plateslate makeFoodPortionInactive slateId " + slateId + " type " + type + " portion " + portion);

	systemDB.transaction(
			function(transaction) {
				transaction.executeSql(
						'Update food set isInactive = 1 where slate=? and type=? and portion=?;',[slateId, type, portion],

				function (transaction, result) {
			}
			);
		}
		);	
}

function makeFoodPortionActive(slateId, type, portion) {
	//alert("plateslate makeFoodPortionActive slateId " + slateId + " type " + type + " portion " + portion);

	systemDB.transaction(
			function(transaction) {
				transaction.executeSql(
						'Update food set isInactive = 0 where slate=? and type=? and portion=?;',[slateId, type, portion],

				function (transaction, result) {
			}
			);
		}
		);	
}

function refreshPortionCache(slate, type) {
	
	//alert("plateslate refreshPortionCache slate.id " + slate.id);
	if (slate.id == 0)
		return;
	
	var plate;
	if (type == "Breakfast") {
		slate.breakfastPortions.length = 0;
		refreshSlateFoodsCache(slate, 0);
		
	} else if (type == "Lunch") {
		slate.lunchPortions.length = 0;
		refreshSlateFoodsCache(slate, 1);
		
	} else if (type == "Dinner") {
		slate.dinnerPortions.length = 0;
		refreshSlateFoodsCache(slate, 2);		
	}
}

function refreshSlateFoodsCache(slate, typeNumber) {
	
	//alert("plateslate insertSlateFoods slate id " + slate.id + " torf " + torf);
	var plateId;
	var plate;
	
		switch (typeNumber) {
		case 0:	// breakfast
			plateId = slate.breakfastId;
			// tjs 120119
			if ((typeof(slate.breakfastPortions) !== 'undefined')) {
				slate.breakfastPortions.length = 0;
			} else {
				slate.breakfastPortions = new Array();
			}
			break;
			
		case 1:	// lunch
			plateId = slate.lunchId;
			if (typeof(slate.lunchPortions) !== 'undefined') {
				slate.lunchPortions.length = 0;
			} else {
				slate.lunchPortions = new Array();
			}
			break;

		case 2:	// dinner
			plateId = slate.dinnerId;
			if (typeof(slate.dinnerPortions) !== 'undefined') {
				slate.dinnerPortions.length = 0;
			} else {
				slate.dinnerPortions = new Array();
			}
			break;
		}
		plate = plates[plateId];
		//alert("plateslate insertSlateFoods slate id " + slate.id + " plate id " + plate.id + " plate type " + plate.type);
		var portionId = plate.portion1;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				//foods.push(portionId);
				switch (typeNumber) {
				case 0:	// breakfast
					//if (!isPortionInCache(slate.breakfastPortions, portionId))
						slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					//if (!isPortionInCache(slate.lunchPortions, portionId))
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					//if (!isPortionInCache(slate.dinnerPortions, portionId))
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			}
		}
				
		portionId = plate.portion2;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (typeNumber) {
				case 0:	// breakfast
					//if (!isPortionInCache(slate.breakfastPortions, portionId))
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					//if (!isPortionInCache(slate.lunchPortions, portionId))
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					//if (!isPortionInCache(slate.dinnerPortions, portionId))
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			}
		}
		//alert("plateslate insertSlateFood portionId #2 " + portionId);
		portionId = plate.portion3;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (typeNumber) {
				case 0:	// breakfast
					//if (!isPortionInCache(slate.breakfastPortions, portionId))
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					//if (!isPortionInCache(slate.lunchPortions, portionId))
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					//if (!isPortionInCache(slate.dinnerPortions, portionId))
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			}
		}
		//alert("plateslate insertSlateFood portionId #3 " + portionId);
		portionId = plate.portion4;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (typeNumber) {
				case 0:	// breakfast
					//if (!isPortionInCache(slate.breakfastPortions, portionId))
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					//if (!isPortionInCache(slate.lunchPortions, portionId))
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					//if (!isPortionInCache(slate.dinnerPortions, portionId))
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			}
		}
		//alert("plateslate insertSlateFood portionId #4 " + portionId);
		portionId = plate.portion5;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (typeNumber) {
				case 0:	// breakfast
					//if (!isPortionInCache(slate.breakfastPortions, portionId))
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					//if (!isPortionInCache(slate.lunchPortions, portionId))
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					//if (!isPortionInCache(slate.dinnerPortions, portionId))
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			}
		}
		//alert("plateslate getRandomPlate portionId #5 " + portionId);
		portionId = plate.portion6;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (typeNumber) {
				case 0:	// breakfast
					//if (!isPortionInCache(slate.breakfastPortions, portionId))
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					//if (!isPortionInCache(slate.lunchPortions, portionId))
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					//if (!isPortionInCache(slate.dinnerPortions, portionId))
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			}
		}
		portionId = plate.portion7;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (typeNumber) {
				case 0:	// breakfast
					//if (!isPortionInCache(slate.breakfastPortions, portionId))
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					//if (!isPortionInCache(slate.lunchPortions, portionId))
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					//if (!isPortionInCache(slate.dinnerPortions, portionId))
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			}
		}
		portionId = plate.portion8;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (typeNumber) {
				case 0:	// breakfast
					//if (!isPortionInCache(slate.breakfastPortions, portionId))
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					//if (!isPortionInCache(slate.lunchPortions, portionId))
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					//if (!isPortionInCache(slate.dinnerPortions, portionId))
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			}
		}
		portionId = plate.portion9;
		if (!isNaN(portionId)) {
			if (portionId > 0) {
				switch (typeNumber) {
				case 0:	// breakfast
					//if (!isPortionInCache(slate.breakfastPortions, portionId))
					slate.breakfastPortions.push(portionId);
					break;
					
				case 1:	// lunch
					//if (!isPortionInCache(slate.lunchPortions, portionId))
					slate.lunchPortions.push(portionId);
					break;
	
				case 2:	// dinner
					//if (!isPortionInCache(slate.dinnerPortions, portionId))
					slate.dinnerPortions.push(portionId);
					break;
				}
				//alert("plateslate insertSlateFood plate name " + selectedPlate.name + " portionId #1 " + portionId);
			}
		}
		syncSlateFoodsCache(slate, typeNumber);
}

// tjs 120119
/*
function isPortionInCache(foodPortions, portionId) {
	var torf = false;
	for (var i = 0; i < foodPortions.length; i++) {
		if (foodPortions[i] == portionId) {
			torf = true;
			break;
		}
	}
	return torf;
}*/

function syncSlateFoodsCache(slate, typeNumber) {
	var type;
	var slateId = slate.id;
	var typePortions;
	switch (typeNumber) {
	case 0:	// breakfast
		type = "Breakfast";
		typePortions = slate.breakfastPortions;
		break;
		
	case 1:	// lunch
		type = "Lunch";
		typePortions = slate.lunchPortions;
		break;

	case 2:	// dinner
		type = "Dinner";
		typePortions = slate.dinnerPortions;
		break;
	}
	deactivateFoodComplement(slateId, type, typePortions);	
	
	for (var i = 0; i < typePortions.length; i++) {
		var portion = typePortions[i];
		updateFood(slateId, type, portion, 0, 0);
	}	
}

function updateFood(slateId, type, portion, master, isInactive) {
		
		systemDB.transaction(
				function(transaction) {
					transaction.executeSql(
							'SELECT id, slate, type, portion, master, isInactive FROM food where slate=? and type=? and portion=?;',[slateId, type, portion],

					function (transaction, result) {
					if (result.rows.length >0) {
						var row = result.rows.item(0);
						var id = parseInt(row.id);
						//alert("plateslate updateFood id " + id + " master " + master + " isInactive " + isInactive);
						systemDB.transaction(
							function(transaction) {
								transaction.executeSql(
								'update food set master=?, isInactive=? where id=?;',
								[master, isInactive, id],
								function(){
									//trxDone('update via add');
									//alert("plateslate addToPortion updated: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
								},
								displayerrormessage
								);
							}
						);
					} else {
						//alert("plateslate addToPortion inserting: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
						systemDB.transaction(
							function(transaction) {
							transaction.executeSql(
							'INSERT INTO food (slate, type, portion, master, isInactive) VALUES (?,?,?,?,?);',
							[slateId, type, portion, master, isInactive],
							function(){
								//trxDone('add');
								//alert("plateslate addToPortion added: type " + portion.type + " name " + portion.name + " desc " + portion.description + " master " + portion.master + " isInactive? " + portion.isInactive);
							},
							displayerrormessage
							);
							}
						);
					}
				}
				);
			}
			);

	}

//deepcopy of slate
//TODO fix the typeof test!
function copySlate(source) {
	// id, offset, date, name, description, breakfastId, lunchId, dinnerId, breakfastPortions, lunchPortions, dinnerPortions, isInactive
	var target = new Slate(source.id, source.offset, source.date, source.name, source.description, source.breakfastId, source.lunchId, source.dinnerId, null, null, null, source.isInactive);
// tjs 120119
	//if (typeof(source.breakfastPortions !== 'undefined')) {
    if (typeof(source.breakfastPortions) !== 'undefined') {
    	if (source.breakfastPortions.length > 0) {
    	   	if (target.breakfastPortions.length > 0)
    	   		target.breakfastPortions.length = 0;
    		//alert("plateslate getChecked slateId " + slateId + " portion id " + id + " plate type " + plate.type + " typePortions.length " + typePortions.length);
    		for (var i = 0; i < source.breakfastPortions.length; i++) {
    			target.breakfastPortions.push(source.breakfastPortions[i]);
     		}
    	}    	
    }

    if (typeof(source.lunchPortions) !== 'undefined') {
    	if (source.lunchPortions.length > 0) {
    	   	if (target.lunchPortions.length > 0)
    	   		target.lunchPortions.length = 0;
    		//alert("plateslate getChecked slateId " + slateId + " portion id " + id + " plate type " + plate.type + " typePortions.length " + typePortions.length);
    		for (var i = 0; i < source.lunchPortions.length; i++) {
    			target.lunchPortions.push(source.lunchPortions[i]);
     		}
    	}    	
    }

    if (typeof(source.dinnerPortions) !== 'undefined') {
    	if (source.dinnerPortions.length > 0) {
    	   	if (target.dinnerPortions.length > 0)
    	   		target.dinnerPortions.length = 0;
    		//alert("plateslate getChecked slateId " + slateId + " portion id " + id + " plate type " + plate.type + " typePortions.length " + typePortions.length);
    		for (var i = 0; i < source.dinnerPortions.length; i++) {
    			target.dinnerPortions.push(source.dinnerPortions[i]);
     		}
    	}    	
    }
    return target;
}

// tjs120117
function copyPortions(sourcePortions) {
	var targetPortions = new Array();
	if (typeof(sourcePortions) !== 'undefined') {
		for (var i = 0; i < sourcePortions.length; i++) {
			targetPortions.push(sourcePortions[i]);
		}
	}
	return targetPortions;
}

function destroySlate(slate) {
    		slate.breakfastPortions = null;
    		slate.lunchPortions = null;
    		slate.dinnerPortions = null;
	slate = null;
}

// for debug only...
function viewSlate(location, slate) {
	var blen = 0;
	var llen = 0;
	var dlen = 0;
	// tjs 120119
    //if (typeof(slate.breakfastPortions !== 'undefined')) {
    if (typeof(slate.breakfastPortions) !== 'undefined') {
    	if (slate.breakfastPortions.length > 0) {
    		blen = slate.breakfastPortions.length;
    	}    	
    }

    if (typeof(slate.lunchPortions) !== 'undefined') {
    	if (slate.lunchPortions.length > 0) {
    		llen = slate.lunchPortions.length;
    	}    	
    }

    if (typeof(slate.dinnerPortions) !== 'undefined') {
    	if (slate.dinnerPortions.length > 0) {
    		dlen = slate.dinnerPortions.length;
    	}    	
    }	
	alert("plateslate viewSlate " + location + " id " + slate.id + " offset " + slate.offset +  " name "  + slate.name + " bid " + slate.breakfastId + " lid " + slate.lunchId + " did " + slate.dinnerId + " blen " + blen + " llen " + llen + " dlen " + dlen);	
}

// tjs 120209
function hyjaxLoginDial() {
	var newDialHtml = '<div data-role="dialog" id="login-dial" data-rel="dialog"><div data-role="header">';
	newDialHtml += '<h1>Login</h1></div>';	
	newDialHtml += '<div data-role="content" data-theme="c"><div class="content-primary"><div id="loginContents">';	
	newDialHtml += '<form name="loginForm"><p>Plate Slate login...</p><p/>';
	//newDialHtml += '<p>Add New Grain Portion...</p><p/>';
	newDialHtml += '<p><label for="name">Username:</label><input type="text" name="name" id="username" value="" placeholder="username" data-theme="d"/></p>';
	newDialHtml += '<p><label for="password">Password:</label><input type="password" name="pword" id="pword" value="" placeholder="" data-theme="d"/></p>';
	newDialHtml += '<p><fieldset data-role="fieldcontain"><label for="refresh">Restore client data from server backup</label>';  
	newDialHtml += '<input type="checkbox" name="refresh" id="refresh" size="30" value="refresh" '; 
	if (refreshDataFromServerDefault) {
		newDialHtml += ' checked="checked" ';
	} 
	newDialHtml += ' data-theme="d"/></fieldset></p>';
	newDialHtml += '</form><br/><br/><a href="#home-page" data-role="button" data-inline="true" data-rel="back" data-theme="a">Cancel</a>';		
	newDialHtml += '<a href="javascript:processLoginForm();" data-role="button" data-inline="true">Login</a><div id ="resultLog"></div>';
	newDialHtml += '</div></div></div><script></script></div>';
	var newDial = $(newDialHtml);
	//add new dialog to page container
	newDial.appendTo($.mobile.pageContainer);
	
	// tweak the new dialog just added into the dom
 	//document.newGrainPortionForm.slateOffset.value = offset;
	//document.newGrainPortionForm.mealName.value = mealName;
   
	// enhance and open the new dialog
    $.mobile.changePage(newDial);
}

function processLoginForm() {
	//alert("plateslate  processLoginForm...");
	//var name = document.loginForm.name.value;
	//var pword = document.loginForm.pword.value;
	var name = $('#username').get(0).value;
	var pword = $('#pword').get(0).value;
	// tjs 120210
	var restoreFromBackup = false;
	//alert("plateslate  processLoginForm name " + name + " password " + pword);
	var optionsChecked = $("#loginContents input:checked");
	//alert("plateslate optionsChecked...");
	if (optionsChecked) {
		var len = optionsChecked.length;
		//alert("plateslate  processLoginForm len " + len);
		var option;
		for (var i = 0; i < len; i++) {
			var inputElm = optionsChecked[i];
			option = inputElm.value;
			//alert("plateslate  processLoginForm option " + option);
			if (option == "refresh") {
				restoreFromBackup = true;
			}
		}
	}
	// use loginForm
	//alert("plateslate  processLoginForm name " + name + " password " + pword + " restoreFromBackup " + restoreFromBackup);

    $.ajax({  
        //type: "POST",  
      type: "GET",
      url: "login4app.php",  
      data: { "name": name,
    	  "pword": pword },  
      success: function(msg) {
          //alert("plateslate processLoginForm success msg " + msg + " len " + msg.length);
          var tempMsg = msg;
    		JSON.parse(tempMsg, function (key, value) {
    			//alert("plateslate processLoginForm key " + key + " value " + value);
    			if (key =='id') {
    				loginInfo.id = value;
    			} else if (key =='userName') {
    				loginInfo.userName = value;
    			} else if (key =='firstName') {
    				loginInfo.firstName = value;
    			} else if (key =='lastName') {
    				loginInfo.lastName = value;
    			}
    			});
    		var accountId = loginInfo.id;
			//alert("plateslate processLoginForm loginInfo.id " + loginInfo.id + " loginInfo.userName " + loginInfo.userName + " loginInfo.firstName " + loginInfo.firstName + " loginInfo.lastName " + loginInfo.lastName);
    	  if (accountId > 0) {
    		  authenticated = true;
    		  loginAccountNumber = accountId;
    		  //alert("plateslate processLoginForm success  authenticated " + authenticated + " loginAccountNumber " + loginAccountNumber + " restoreFromBackup " + restoreFromBackup);
     		  //alert("plateslate processLoginForm success closing dialog...");
    		  // tjs 120119
     		  //setLogoutButton();
    		  // tjs 120210
    		  if (restoreFromBackup == true) {
    			  // tjs 120221
    			  //doRestoreFromBackup(loginAccountNumber);
    			  doRestoreFromBackup(loginAccountNumber, null);
    		  } else {
	    		  $('.loginLogout').children('.ui-btn-inner').children('.ui-btn-text').text("Logout");
	    		  $("#login-dial").dialog("close");
    		  }
    	  } else {
    		  alert("Login failed!");
    	  }
      }  
    });  
    
	//alert("plateslate  processLoginForm called ajax...");
    return false;  
}

//tjs 120209
function hyjaxLogoutDial() {
	var newDialHtml = '<div data-role="dialog" id="logout-dial" data-rel="dialog"><div data-role="header">';
	newDialHtml += '<h1>Logout</h1></div>';	
	newDialHtml += '<div data-role="content" data-theme="c">';	
	newDialHtml += '<form name="logoutForm"><p>Plate Slate logout...</p><p/>';
	newDialHtml += '<p><fieldset data-role="fieldcontain"><label for="backup">Backup client data to server</label>';  
	newDialHtml += '<input type="checkbox" name="backup" id="backup" size="30" value="backup" '; 
	// tjs 120216
	//if (backupDataToServer) {
	if (backupDataToServer == true) {
		newDialHtml += ' checked="checked" ';
	}// else {
		//newDialHtml += ' value="" ';
	//}
	newDialHtml += ' data-theme="d"/></fieldset></p>';
	newDialHtml += '</form><br/><br/><a href="#home-page" data-role="button" data-inline="true" data-rel="back" data-theme="a">Cancel</a>';		
	newDialHtml += '<a href="javascript:doLogout();" data-role="button" data-inline="true">Logout</a><div id ="resultLog"></div>';
	newDialHtml += '</div><script></script></div>';
	var newDial = $(newDialHtml);
	//add new dialog to page container
	newDial.appendTo($.mobile.pageContainer);
	
	// tweak the new dialog just added into the dom
 	//document.newGrainPortionForm.slateOffset.value = offset;
	//document.newGrainPortionForm.mealName.value = mealName;
   
	// enhance and open the new dialog
    $.mobile.changePage(newDial);
}

function doLogout() {
	//alert("plateslate   doLogout");
	// tjs 120203
	//doClientBackup();
	// tjs 120209
	// tjs 120216
	//if (backupDataToServer) {
	var isBackupStarted = false;
	if (backupDataToServer == true) {
		// tjs 120216
		//var confirmBackup = document.logoutForm.backup.value;
		//var confirmBackup = $('#backup').get(0).value;
		//alert("plateSlateCellApp doLogout confirmBackup " + confirmBackup);
		//if (confirmBackup == 'backup') {
		//	doClientBackup();
		//}
    	var fieldsChecked = $("#logout-dial input:checked");
    	var len = fieldsChecked.length;
    	//alert("plateSlateCellApp hyjaxPreferencesPage len " + len);
    	var field;
    	for (var i = 0; i < len; i++) {
    		var inputElm = fieldsChecked[i];
    		field = inputElm.value;
        	//alert("plateSlateCellApp hyjaxPreferencesPage pref " + pref);
    		if (field == "backup") {
    			isBackupStarted = true;
    			doClientBackup();
    		}
    	}
	}
	if (!isBackupStarted) {
		if (backupDataToServer == true)
			$("#logout-dial").dialog("close");
		finishLogout();
	}
	/*
    var dataString = '';  
	    $.ajax({  
	        //type: "POST",  
      type: "GET",  
      url: "logout4app.php",  
      data: dataString,  
      success: function(msg) {
          //alert("plateslate processLoginForm success  msg " + msg);
    	  if (msg == "false") {
    		  authenticated = false;
    		  loginAccountNumber = 0;
    		  //alert("plateslate handleLogout success  authenticated " + authenticated);
     	  }
      }  
    }); 
	    */
}

function finishLogout() {
    var dataString = '';  
    $.ajax({  
        //type: "POST",  
  type: "GET",  
  url: "logout4app.php",  
  data: dataString,  
  success: function(msg) {
      //alert("plateslate processLoginForm success  msg " + msg);
	  if (msg == "false") {
		  authenticated = false;
		  loginAccountNumber = 0;
		  //alert("plateslate handleLogout success  authenticated " + authenticated);
 	  }
  }  
}); 	
}

function hijaxPreferencesPage() {
	//TODO
	//open page with bfast|lunch|dinner pref
	//pref checkboc states meals planned (e.g. just dinner)
//pref - setting reset would re-activitate inactibe plates

	//alert("plateslate showPlaceSetting slateOffset " + slateOffset);
	// cf <div data-role="page" data-add-back-btn="true" id="report-page" data-title="Report">
	var newPageHtml = '<div data-role="page" data-add-back-btn="true" id="preferences-page" data-title="Preferences">';
	newPageHtml += '<div data-role="header" data-theme="f" data-position="fixed">';
	newPageHtml += '<a href="index.html" data-icon="home" data-iconpos="notext" data-direction="reverse" class="ui-btn-left jqm-home">Home</a>';
	newPageHtml += '<h1>Preferences</h1>';
	newPageHtml += '</div>';
	newPageHtml += '<div data-role="content"><div class="content-primary"><div id="placeSettingContents">';
	newPageHtml += '<form action="">';
	newPageHtml += '<p>Choose Place Settings Preferences for PlateSlate WebApp!</p>';
	newPageHtml += '<fieldset>';  
	newPageHtml += '<label for="suggestMethod" id="suggestMethod_label">Plates are to be suggested randomly</label>';  
	newPageHtml += '<input type="checkbox" name="suggestMethod" id="suggestMethod" size="30" value="random" ';
	if (plateSelectionRandom) {
		newPageHtml += ' checked="checked" ';
	}
	newPageHtml += '/><br />';  
	      
	newPageHtml += '<label for="filterMethod" id="filterMethod_label">Filter plate suggestions by season</label>';  
	newPageHtml += '<input type="checkbox" name="filterMethod" id="filterMethod" size="30" value="season" ';  
	if (plateSelectionSeasonal) {
		newPageHtml += ' checked="checked" ';
	}
	newPageHtml += '/><br />';  

	newPageHtml += '<label for="shareMethod" id="shareMethod_label">Share slates with server (for aggregate reports)</label>';  
	newPageHtml += '<input type="checkbox" name="shareMethod" id="shareMethod" size="30" value="share" ';  
	if (plateSelectionShared) {
		newPageHtml += ' checked="checked" ';
	}
	newPageHtml += '/><br />';  	      
	newPageHtml += '<label for="shareDinnerOnly" id="shareDinnerMethod_label">Share ONLY DINNER slates with server</label>';  
	newPageHtml += '<input type="checkbox" name="shareDinnerOnly" id="shareDinnerOnly" size="30" value="shareDinner" ';  
	if (slateMealPlansForDinnerOnly) {
		newPageHtml += ' checked="checked" ';
	}
	// tjs 120209
	newPageHtml += '/><br />';  	      
	newPageHtml += '<p>NOTE: For each Plate Slate registered member just ONE device should have the following option enabled!</p>';  
	newPageHtml += '<p>If checked, then you will be prompted for a confirmation to start the backup as you logout from the server.</p>';  
	newPageHtml += '<label for="backupToServer" id="backupMethod_label">Backup <strong>all</strong> client data to server (from this mobile device or computer).</label>';  
	newPageHtml += '<input type="checkbox" name="backupToServer" id="backupToServer" size="30" value="bud" ';  
	if (backupDataToServer) {
		newPageHtml += ' checked="checked" ';
	}
	newPageHtml += '/><br />';  	      
	newPageHtml += '<p>NOTE: For each Plate Slate registered member any device could have the following option enabled!</p>';  
	newPageHtml += '<p>If checked, then it becomes the default confirmation setting to start the restoration of client data as you login to the server.</p>';  
	newPageHtml += '<label for="restoreFromServer" id="restoreMethod_label">Restore <strong>all</strong> client data from server (refreshes this mobile device or computer with data backed up from another device).</label>';  
	newPageHtml += '<input type="checkbox" name="restoreFromServer" id="restoreFromServer" size="30" value="res" ';  
	if (refreshDataFromServerDefault) {
		newPageHtml += ' checked="checked" ';
	}
	newPageHtml += '/>';  	      	
	newPageHtml += '</fieldset>';  
	newPageHtml += '<br />';
	newPageHtml += '<input type="button" name="placeSettingPrefSubmit" class="placeSettingPrefButton" id="placeSettingPrefSubmit_btn" value="Save Preferences"';
	if (authenticated) {
		newPageHtml += '/>';
	} else {
		newPageHtml += ' disabled="disabled" />';
	}	  
	newPageHtml += '</form>';
	newPageHtml += '<br />';  
	newPageHtml += '<br />';
	if (!authenticated) {
		newPageHtml += '<p style="color: red;" >NOTE: Only Logged In Users May Alter Preferences or Edit Plates!</p>';
	}
	newPageHtml += '</div>';	// placeSettingContents
	newPageHtml += '</div>';	// content-primary
	newPageHtml += '</div>';	// content
	newPageHtml += '<script type="text/javascript"></script></div>'; // preferences-page

	//alert("plateSlateCellApp hijaxPreferencesPage newPageHtml " + newPageHtml);
	var newPage = $(newPageHtml);
	//add new dialog to page container
	newPage.appendTo($.mobile.pageContainer);
	
	//alert("plateSlateCellApp hijaxPreferencesPage html added to dom...");
	
	// tweak the new page just added into the dom
	   $(".placeSettingPrefButton").click(function() {  
	        // validate and process form here  
	            var plateSelectionRandom = false;
	            var plateSelectionSeasonal = false;
	            var plateSelectionShared = false;
	            var slateMealPlansForDinnerOnly = false;
	            // tjs 120216
	            var backupDataToServer = false;
	            var refreshDataFromServerDefault = false;
	            // placeSettingContents
	        	var prefsChecked = $("#placeSettingContents input:checked");
	        	var len = prefsChecked.length;
	        	//alert("plateSlateCellApp hyjaxPreferencesPage len " + len);
	        	var pref;
	        	for (var i = 0; i < len; i++) {
	        		var inputElm = prefsChecked[i];
	        		pref = inputElm.value;
		        	//alert("plateSlateCellApp hyjaxPreferencesPage pref " + pref);
	        		if (pref == "random") {
	        			plateSelectionRandom = true;
	        		}
	        		if (pref == "season") {
	        			plateSelectionSeasonal = true;
	        		}
	        		if (pref == "share") {
	        			plateSelectionShared = true;
	        		}
	        		if (pref == "shareDinner") {
	        			slateMealPlansForDinnerOnly = true;
	        		}
	        		// tjs 120209
	        		if (pref == "bud") {
	        			backupDataToServer = true;
	        		}
	        		if (pref == "res" && !backupDataToServer) {
	        			refreshDataFromServerDefault = true;
	        		}
	        	}
	        	
	        	//update setting table with this info and upon refresh/reload use the persisted values to initialize the globals
	        	//alert("plateslate showPlaceSetting placeSettingPrefButton click preferences.plateSelectionRandom " + preferences.plateSelectionRandom + " preferences.plateSelectionSeasonal " + preferences.plateSelectionSeasonal + " preferences.plateSelectionShared " + preferences.plateSelectionShared);
	        	preferences.plateSelectionRandom = plateSelectionRandom;
	        	preferences.plateSelectionSeasonal = plateSelectionSeasonal;
	        	preferences.plateSelectionShared = plateSelectionShared;
	        	preferences.slateMealPlansForDinnerOnly = slateMealPlansForDinnerOnly;
	        	preferences.backupDataToServer = backupDataToServer;
	        	preferences.refreshDataFromServerDefault = refreshDataFromServerDefault;
	        	//alert("plateslate showPlaceSetting placeSettingPrefButton click preferences.plateSelectionRandom " + preferences.plateSelectionRandom + " preferences.plateSelectionSeasonal " + preferences.plateSelectionSeasonal + " preferences.plateSelectionShared " + preferences.plateSelectionShared);
	        	localStorage.setItem('preferences', JSON.stringify(preferences));	// persists above cached data
	        	//alert("plateslate showPlaceSetting placeSettingPrefButton click preferences persisted" );
	        	//loadPreferences();
				setTimeout(function() {
					//alert('hello');
					loadPreferences();
					},1000);							

	        	//alert("index prefs plateSelectionRandom " + plateSelectionRandom + " plateSelectionSeasonal " + plateSelectionSeasonal + " plateSelectionShared " + plateSelectionShared);
	      });  
		//alert("plateSlateCellApp hijaxPreferencesPage dom tweaked...");

	// enhance and open the new page
    $.mobile.changePage(newPage);
	//alert("plateSlateCellApp hijaxPreferencesPage page changed...");
}

/*
 * model:
<slates>
	<slate name="August 26">
		<plate name="Eggs" type="Breakfast" description="">
			//<portions>
				<portion type="Grain">
				(a portion).
				</portion>
			//</portions>
		</plate>
	</slate>
</slates>
*/

function hijaxReportPage() {
	var newPageHtml = '<div data-role="page" data-add-back-btn="true" id="report-page" data-title="Report">';
	//newPageHtml += '<div data-role="header"><h1>Meal Plan Report</h1></div>';
	newPageHtml += '<div data-role="header" data-theme="f" data-position="fixed">';
	newPageHtml += '<a href="index.html" data-icon="home" data-iconpos="notext" data-direction="reverse" class="ui-btn-left jqm-home">Home</a>';
	newPageHtml += '<h1>Reports</h1>';
	newPageHtml += '</div>';
	newPageHtml += '<div data-role="content">';
	newPageHtml += '<p>The following report shows what plates are slated to be served over the next few days.</p>';
	newPageHtml += '<p><a href="javascript:hijaxSlateOfPlatesPage();">Slate of Plates</a></p>';	
	newPageHtml += '<p>Dinner is often the meal that demands both variety and detailed planning.  This report shows dinners that had been slated earlier as well as the current plans.</p>';
	newPageHtml += '<p><a href="javascript:hijaxDinnerSlatePage();">Dinner Slate</a></p>';	
	newPageHtml += '<p>Before leaving home to shop for food this report may be helpful.  It shows detailed portions you will need for the dinner plates that are slated for the next few days.</p>';
	newPageHtml += '<p><a href="javascript:hijaxDinnerPortionsSlatePage();">Dinner Portions Slate</a></p>';	
	newPageHtml += '<p>The Prep Cook and Chef maintain a whiteboard in the kitchen.  It shows detailed portions they need for the dinner plans over the next few days.</p>';
	newPageHtml += '<p><a href="javascript:hijaxKitchenPortionsWhiteboardPage();">Kitchen Portions Whiteboard</a></p>';	
	newPageHtml += '<p>For logged in users, the PlateSlate Server provides a detailed and printable report of slated plates....</p>';
	newPageHtml += '<p><a href="javascript:doReport();">Get PDF PlateSlate Report</a></p>';	
	newPageHtml += '</div><script type="text/javascript"></script></div>';
	var newPage = $(newPageHtml);
	//add new dialog to page container
	newPage.appendTo($.mobile.pageContainer);
	// enhance and open the new page
    $.mobile.changePage(newPage);
}

function hijaxSlateOfPlatesPage() {
	/*
	 * <div data-role="page" id="home">
	<div data-role="header">
		<h1>5-Column Grid</h1>
	</div>

	<div data-role="content">
		<div class="ui-grid-d" style="text-align: center;"> 
			<div class="ui-block-a">&#xe21c;</div>
			<div class="ui-block-b">&#xe21d;</div>
			<div class="ui-block-c">&#xe21e;</div>	
			<div class="ui-block-d">&#xe21f;</div>
			<div class="ui-block-e">&#xe220;</div>
		</div>
	</div>
</div>

	 */
	var thresholdOffset = slateOffsetThreshold;
	//var chalkColor = makeRandomScreenReportColor();
	//var divStyle = 'color:' + chalkColor;
	//var chalkColors = makeRandomScreenReportColors(3);
	var chalkColors = getScreenReportHues(3);
	var divHeaderStyle = 'color:' + makeColor(chalkColors[0]);
	var divLabelStyle = 'color:' + makeColor(chalkColors[1]);
	var divDataStyle = 'color:' + makeColor(chalkColors[2]);
	
	//var results = getReportGridArrays(thresholdOffset);
	var results = getReportGridArrays(thresholdOffset, 5, false);
//	alert("plateSlateCellApp hijaxScreenReportPage results.length " + results.length);
	var dows = results[0];
	var breakfastPlates = results[1];
	var lunchPlates = results[2];
	var dinnerPlates = results[3];
	var len = dows.length;
	// tjs 120120
	if (len < 2) {
		$.mobile.changePage("#insufficient-data-dial");
		return;
	}
	var gridClass = 'ui-grid-';
	if (len < 3)
		gridClass += 'a';
	else if (len < 4)
		gridClass += 'b';
	else if (len < 5)
		gridClass += 'c';
	else if (len < 6)
		gridClass += 'd';
	var columnClass = 'ui-block-';
	var newPageHtml = '<div data-role="page" data-add-back-btn="true" id="slate-of-plates-report-page" data-title="Slate of Plates">';
	newPageHtml += '<div data-role="header" data-theme="f" data-position="fixed">';
	newPageHtml += '<a href="index.html" data-icon="home" data-iconpos="notext" data-direction="reverse" class="ui-btn-left jqm-home">Home</a>';
	newPageHtml += '<h1>Slate of Plates</h1>';
	newPageHtml += '</div>';
	newPageHtml += '<div data-role="content">';
	newPageHtml += '<div class="' + gridClass + '" style="text-align: center;">';
	//newPageHtml += '<div class="chalk" style="' + divStyle + ';">';
	newPageHtml += '<div class="chalk">';
	newPageHtml += '<div style="' + divHeaderStyle + ';">';
	// grid headers (dow)
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'a"><strong>'+ dows[i] + '</strong></div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b"><strong>'+ dows[i] + '</strong></div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c"><strong>'+ dows[i] + '</strong></div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd"><strong>'+ dows[i] + '</strong></div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e"><strong>'+ dows[i] + '</strong></div>';
			break;			
		}			
	}
	newPageHtml += '</div>';
	newPageHtml += '<div style="' + divLabelStyle + ';">';
	// breakfast headers
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'a"><i>Breakfast</i></div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b"><i>Breakfast</i></div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c"><i>Breakfast</i></div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd"><i>Breakfast</i></div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e"><i>Breakfast</i></div>';
			break;			
		}			
	}
	newPageHtml += '</div>';
	newPageHtml += '<div style="' + divDataStyle + ';">';
	// breakfast plates
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			//newPageHtml += '<div class="' + columnClass + 'a">'+ breakfastPlates[i] + '</div>';
			newPageHtml += '<div class="' + columnClass + 'a">'+ breakfastPlates[i].name + '</div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b">'+ breakfastPlates[i].name + '</div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c">'+ breakfastPlates[i].name + '</div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd">'+ breakfastPlates[i].name + '</div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e">'+ breakfastPlates[i].name + '</div>';
			break;			
		}			
	}
	newPageHtml += '</div>';
	newPageHtml += '<div style="' + divLabelStyle + ';">';
	// lunch headers
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'a"><i>Lunch</i></div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b"><i>Lunch</i></div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c"><i>Lunch</i></div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd"><i>Lunch</i></div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e"><i>Lunch</i></div>';
			break;			
		}			
	}
	newPageHtml += '</div>';
	newPageHtml += '<div style="' + divDataStyle + ';">';
	// lunch plates
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'a">'+ lunchPlates[i].name + '</div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b">'+ lunchPlates[i].name + '</div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c">'+ lunchPlates[i].name + '</div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd">'+ lunchPlates[i].name + '</div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e">'+ lunchPlates[i].name + '</div>';
			break;			
		}			
	}
	newPageHtml += '</div>';
	newPageHtml += '<div style="' + divLabelStyle + ';">';
	// dinner headers
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'a"><i>Dinner</i></div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b"><i>Dinner</i></div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c"><i>Dinner</i></div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd"><i>Dinner</i></div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e"><i>Dinner</i></div>';
			break;			
		}			
	}
	newPageHtml += '</div>';
	newPageHtml += '<div style="' + divDataStyle + ';">';
	// dinner plates
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'a">'+ dinnerPlates[i].name + '</div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b">'+ dinnerPlates[i].name + '</div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c">'+ dinnerPlates[i].name + '</div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd">'+ dinnerPlates[i].name + '</div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e">'+ dinnerPlates[i].name + '</div>';
			break;			
		}			
	}
	newPageHtml += '</div>';
	newPageHtml += '</div>';
	newPageHtml += '</div></div><script type="text/javascript"></script></div>';
	var newPage = $(newPageHtml);
	//add new dialog to page container
	newPage.appendTo($.mobile.pageContainer);
	// enhance and open the new page
    $.mobile.changePage(newPage);
}

function hijaxDinnerSlatePage() {
	/*
	 * <div data-role="page" id="home">
	<div data-role="header">
		<h1>5-Column Grid</h1>
	</div>

	<div data-role="content">
		<div class="ui-grid-d" style="text-align: center;"> 
			<div class="ui-block-a">&#xe21c;</div>
			<div class="ui-block-b">&#xe21d;</div>
			<div class="ui-block-c">&#xe21e;</div>	
			<div class="ui-block-d">&#xe21f;</div>
			<div class="ui-block-e">&#xe220;</div>
		</div>
	</div>
</div>

	 */
	var thresholdOffset = slateOffsetThreshold;
	//var chalkColor = makeRandomScreenReportColor();
	//var divStyle = 'color:' + chalkColor;
	//var chalkColors = makeRandomScreenReportColors(3);
	var chalkColors = getScreenReportHues(2);
	var divHeaderStyle = 'color:' + makeColor(chalkColors[0]);
	//var divLabelStyle = 'color:' + makeColor(chalkColors[1]);
	var divDataStyle = 'color:' + makeColor(chalkColors[1]);
	
	//var results = getReportGridArrays(thresholdOffset);
	var results = getReportGridArrays(thresholdOffset, 15, true);
	//alert("plateSlateCellApp hijaxDinnerSlatePage results.length " + results.length);
	var dows = results[0];
	var breakfastPlates = results[1]; // not used here
	var lunchPlates = results[2]; // not used here
	var dinnerPlates = results[3];
	var len = dows.length;
	// tjs 120120
	if (len < 3) {
		$.mobile.changePage("#insufficient-data-dial");
		return;
	}
	//if (len < 3)
	//	return;
	//alert("plateSlateCellApp hijaxDinnerSlatePage len " + len);
	// three column report
	var gridClass = 'ui-grid-b';
	var columnCase;

	var columnClass = 'ui-block-';
	var newPageHtml = '<div data-role="page" data-add-back-btn="true" id="dinner-slate-report-page" data-title="Dinner Slate">';
	newPageHtml += '<div data-role="header" data-theme="f" data-position="fixed">';
	newPageHtml += '<a href="index.html" data-icon="home" data-iconpos="notext" data-direction="reverse" class="ui-btn-left jqm-home">Home</a>';
	newPageHtml += '<h1>Dinner Slate</h1>';
	newPageHtml += '</div>';
	newPageHtml += '<div data-role="content">';
	newPageHtml += '<div class="' + gridClass + '" style="text-align: center;">';
	//newPageHtml += '<div class="chalk" style="' + divStyle + ';">';
	newPageHtml += '<div class="chalk">';
	//newPageHtml += '<div style="' + divHeaderStyle + ';">';
	// grid headers (dow)
	for (var i = 0; i < len; i += 3) {
		//columnCase = (i + 1)%3;
		//columnCase = (i + 3)%3;
		//alert("plateSlateCellApp hijaxDinnerSlatePage i " + i + " columnCase " + columnCase);
		newPageHtml += '<div style="' + divHeaderStyle + ';">';
		//switch (columnCase) {
			//case 0:
				newPageHtml += '<div class="' + columnClass + 'a"><strong>'+ dows[i] + '</strong></div>';
				//break;
			//case 1:
				if (typeof(dows[i + 1]) !== 'undefined') {
					newPageHtml += '<div class="' + columnClass + 'b"><strong>'+ dows[i + 1] + '</strong></div>';
				} else {
					newPageHtml += '<div class="' + columnClass + 'b">&nbsp;</div>';
				}
				//break;
			//case 2:
				if (typeof(dows[i + 2]) !== 'undefined') {
					newPageHtml += '<div class="' + columnClass + 'c"><strong>'+ dows[i + 2] + '</strong></div>';
				}else {
					newPageHtml += '<div class="' + columnClass + 'c">&nbsp;</div>';
				}
				//break;		
		//}		//	
		newPageHtml += '</div>';
		newPageHtml += '<div style="' + divDataStyle + ';">';
		//switch (columnCase) {
			//case 0:
				newPageHtml += '<div class="' + columnClass + 'a">'+ dinnerPlates[i].name + '</div>';
				//break;
			//case 1:
				if (typeof(dinnerPlates[i + 1]) !== 'undefined') {
				newPageHtml += '<div class="' + columnClass + 'b">'+ dinnerPlates[i + 1].name + '</div>';
				} else {
					newPageHtml += '<div class="' + columnClass + 'b">&nbsp;</div>';
				}
				//break;
			//case 2:
				if (typeof(dinnerPlates[i + 2]) !== 'undefined') {
				newPageHtml += '<div class="' + columnClass + 'c">'+ dinnerPlates[i + 2].name + '</div>';
				} else {
					newPageHtml += '<div class="' + columnClass + 'c">&nbsp;</div>';
				}
				//break;
		//}			
		newPageHtml += '</div>';
		//switch (columnCase) {
			//case 0:
				newPageHtml += '<div class="' + columnClass + 'a">&nbsp;</div>';
				//break;
			//case 1:
				newPageHtml += '<div class="' + columnClass + 'b">&nbsp;</div>';
				//break;
			//case 2:
				newPageHtml += '<div class="' + columnClass + 'c">&nbsp;</div>';
				//break;
		//}			
	}
	newPageHtml += '</div>';
	newPageHtml += '</div></div><script type="text/javascript"></script></div>';
	var newPage = $(newPageHtml);
	//add new dialog to page container
	newPage.appendTo($.mobile.pageContainer);
	// enhance and open the new page
    $.mobile.changePage(newPage);
}

function hijaxDinnerPortionsSlatePage() {
	/*
	 * <div data-role="page" id="home">
	<div data-role="header">
		<h1>5-Column Grid</h1>
	</div>

	<div data-role="content">
		<div class="ui-grid-d" style="text-align: center;"> 
			<div class="ui-block-a">&#xe21c;</div>
			<div class="ui-block-b">&#xe21d;</div>
			<div class="ui-block-c">&#xe21e;</div>	
			<div class="ui-block-d">&#xe21f;</div>
			<div class="ui-block-e">&#xe220;</div>
		</div>
	</div>
</div>

PortionName		Color		Border
Grains			dd7d22		e8ba97
Protein			705b9b		ac99c8
Vegetables		00b65b		c9dc3c
Fruits			dc332e		fa98ae

Dairy			4c98d0		8cc7eb

	 */
	var thresholdOffset = slateOffsetThreshold;
	//var chalkColor = makeRandomScreenReportColor();
	//var divStyle = 'color:' + chalkColor;
	//var chalkColors = makeRandomScreenReportColors(3);
	var chalkColors = getScreenReportHues(3);
	var divHeaderStyle = 'color:' + makeColor(chalkColors[0]);
	var divLabelStyle = 'color:' + makeColor(chalkColors[1]);
	//var divLabelStyle;
	var divDataStyle = 'color:' + makeColor(chalkColors[2]);
	
	var results = getReportGridArrays(thresholdOffset, 4, false);
//	alert("plateSlateCellApp hijaxScreenReportPage results.length " + results.length);
	var dows = results[0];
	var breakfastPlates = results[1]; // not needed here
	var lunchPlates = results[2]; // not needed here
	var dinnerPlates = results[3];
	// tjs 120116
	var dinnerPortions = results[6];
	var len = dows.length;
	// tjs 120120
	if (len < 2) {
		$.mobile.changePage("#insufficient-data-dial");
		return;
	}
	//if (len < 2)
	//	return;
	var gridClass = 'ui-grid-';
	if (len < 3)
		gridClass += 'b';
	else if (len < 4)
		gridClass += 'c';
	else if (len < 5)
		gridClass += 'd';

	var columnClass = 'ui-block-';
	var newPageHtml = '<div data-role="page" data-add-back-btn="true" id="dinner-portions-slate-report-page" data-title="Dinner Portions Slate">';
	newPageHtml += '<div data-role="header" data-theme="f" data-position="fixed">';
	newPageHtml += '<a href="index.html" data-icon="home" data-iconpos="notext" data-direction="reverse" class="ui-btn-left jqm-home">Home</a>';
	newPageHtml += '<h1>Dinner Portions Slate</h1>';
	newPageHtml += '</div>';
	newPageHtml += '<div data-role="content">';
	newPageHtml += '<div class="' + gridClass + '" style="text-align: center;">';
	//newPageHtml += '<div class="chalk" style="' + divStyle + ';">';
	newPageHtml += '<div class="chalk">';
	newPageHtml += '<div style="' + divHeaderStyle + ';">';
	newPageHtml += '<div class="' + columnClass + 'a">&nbsp;</div>';
	// grid headers (dow)
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'b"><strong>'+ dows[i] + '</strong></div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'c"><strong>'+ dows[i] + '</strong></div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'd"><strong>'+ dows[i] + '</strong></div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'e"><strong>'+ dows[i] + '</strong></div>';
			break;		
		}			
	}
	newPageHtml += '</div>';
	
	newPageHtml += '<div style="' + divLabelStyle + ';">';
	newPageHtml += '<div class="' + columnClass + 'a">Dinner</div>';
	// grid headers (dow)
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'b"><strong>'+ dinnerPlates[i].name + '</strong></div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'c"><strong>'+ dinnerPlates[i].name + '</strong></div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'd"><strong>'+ dinnerPlates[i].name + '</strong></div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'e"><strong>'+ dinnerPlates[i].name + '</strong></div>';
			break;		
		}			
	}
	newPageHtml += '</div>';

	newPageHtml += '<div style="' + divDataStyle + ';">';
	newPageHtml += '<div class="' + columnClass + 'a"><span style="color: #dd7d22;">Grain</span></div>';
	// grain portions
	for (var i = 0; i < len; i++) {
		var typePortions = dinnerPortions[i];
		var typePortion = '&nbsp;';
		for (j = 0; j < typePortions.length; j++) {
			var portion = portions[typePortions[j]];
			if (portion.type == "Grain") 
				typePortion += portion.name + '&nbsp;';
		}
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'b">'+ typePortion + '</div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'c">'+ typePortion + '</div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'd">'+ typePortion + '</div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'e">'+ typePortion + '</div>';
			break;
		case 4:
			break;			
		}			
	}
	newPageHtml += '</div>';

	newPageHtml += '<div style="' + divDataStyle + ';">';
	newPageHtml += '<div class="' + columnClass + 'a"><span style="color: #705b9b;">Protein</span></div>';
	// protein portions
	for (var i = 0; i < len; i++) {
		var typePortions = dinnerPortions[i];
		var typePortion = '&nbsp;';
		for (j = 0; j < typePortions.length; j++) {
			var portion = portions[typePortions[j]];
			if (portion.type == "Protein") 
				typePortion += portion.name + '&nbsp;';
		}
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'b">'+ typePortion + '</div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'c">'+ typePortion + '</div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'd">'+ typePortion + '</div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'e">'+ typePortion + '</div>';
			break;
		case 4:
			break;			
		}			
	}
	newPageHtml += '</div>';
	
	newPageHtml += '<div style="' + divDataStyle + ';">';
	newPageHtml += '<div class="' + columnClass + 'a"><span style="color: #00b65b;">Vegetable</span></div>';
	// vegetable portions
	for (var i = 0; i < len; i++) {
		var typePortions = dinnerPortions[i];
		var typePortion = '&nbsp;';
		for (j = 0; j < typePortions.length; j++) {
			var portion = portions[typePortions[j]];
			if (portion.type == "Vegetables") 
				typePortion += portion.name + '&nbsp;';
		}
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'b">'+ typePortion + '</div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'c">'+ typePortion + '</div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'd">'+ typePortion + '</div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'e">'+ typePortion + '</div>';
			break;
		case 4:
			break;			
		}			
	}
	newPageHtml += '</div>';
	
	newPageHtml += '<div style="' + divDataStyle + ';">';
	newPageHtml += '<div class="' + columnClass + 'a"><span style="color: #dc332e;">Fruit</span></div>';
	// fruit portions
	for (var i = 0; i < len; i++) {
		var typePortions = dinnerPortions[i];
		var typePortion = '&nbsp;';
		for (j = 0; j < typePortions.length; j++) {
			var portion = portions[typePortions[j]];
			if (portion.type == "Fruits") 
				typePortion += portion.name + '&nbsp;';
		}
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'b">'+ typePortion + '</div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'c">'+ typePortion + '</div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'd">'+ typePortion + '</div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'e">'+ typePortion + '</div>';
			break;
		case 4:
			break;			
		}			
	}
	newPageHtml += '</div>';
	
	newPageHtml += '<div style="' + divDataStyle + ';">';
	newPageHtml += '<div class="' + columnClass + 'a"><span style="color: #4c98d0;">Dairy</span></div>';
	// dairy portions
	for (var i = 0; i < len; i++) {
		var typePortions = dinnerPortions[i];
		var typePortion = '&nbsp;';
		for (j = 0; j < typePortions.length; j++) {
			var portion = portions[typePortions[j]];
			if (portion.type == "Dairy") 
				typePortion += portion.name + '&nbsp;';
		}
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'b">'+ typePortion + '</div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'c">'+ typePortion + '</div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'd">'+ typePortion + '</div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'e">'+ typePortion + '</div>';
			break;
		case 4:
			break;			
		}			
	}
	newPageHtml += '</div>';

	newPageHtml += '</div>';
	newPageHtml += '</div></div><script type="text/javascript"></script></div>';
	var newPage = $(newPageHtml);
	//add new dialog to page container
	newPage.appendTo($.mobile.pageContainer);
	// enhance and open the new page
    $.mobile.changePage(newPage);
}

function hijaxKitchenPortionsWhiteboardPage() {
	/*
	 * <div data-role="page" id="home">
	<div data-role="header">
		<h1>5-Column Grid</h1>
	</div>

	<div data-role="content">
		<div class="ui-grid-d" style="text-align: center;"> 
			<div class="ui-block-a">&#xe21c;</div>
			<div class="ui-block-b">&#xe21d;</div>
			<div class="ui-block-c">&#xe21e;</div>	
			<div class="ui-block-d">&#xe21f;</div>
			<div class="ui-block-e">&#xe220;</div>
		</div>
	</div>
</div>

PortionName		Color		Border
Grains			dd7d22		e8ba97
Protein			705b9b		ac99c8
Vegetables		00b65b		c9dc3c
Fruits			dc332e		fa98ae

Dairy			4c98d0		8cc7eb

	 */
	var thresholdOffset = slateOffsetThreshold;
	//var chalkColor = makeRandomScreenReportColor();
	//var divStyle = 'color:' + chalkColor;
	//var chalkColors = makeRandomScreenReportColors(3);
	var chalkColors = getScreenReportHues(3);
	var divHeaderStyle = 'color:' + makeColor(chalkColors[0]);
	var divLabelStyle = 'color:' + makeColor(chalkColors[1]);
	//var divLabelStyle;
	var divDataStyle = 'color:' + makeColor(chalkColors[2]);
	
	var results = getReportGridArrays(thresholdOffset, 5, false);
//	alert("plateSlateCellApp hijaxScreenReportPage results.length " + results.length);
	var dows = results[0];
	var breakfastPlates = results[1]; // not needed here
	var lunchPlates = results[2]; // not needed here
	var dinnerPlates = results[3];
	var breakfastPortions = results[4];
	var lunchPortions = results[5];
	var dinnerPortions = results[6];
	var len = dows.length;
	// tjs 120120
	if (len < 2) {
		$.mobile.changePage("#insufficient-data-dial");
		return;
	}
	//if (len < 2)
	//	return;
	var gridClass = 'ui-grid-';
	if (len < 3)
		gridClass += 'a';
	else if (len < 4)
		gridClass += 'b';
	else if (len < 5)
		gridClass += 'c';
	else if (len < 6)
		gridClass += 'd';
	var columnClass = 'ui-block-';
	var newPageHtml = '<div data-role="page" data-add-back-btn="true" id="kitchen-portions-whiteboard-report-page" data-title="Kitchen Portions Whiteboard">';
	newPageHtml += '<div data-role="header" data-theme="f" data-position="fixed">';
	newPageHtml += '<a href="index.html" data-icon="home" data-iconpos="notext" data-direction="reverse" class="ui-btn-left jqm-home">Home</a>';
	newPageHtml += '<h1>Kitchen Portions Whiteboard</h1>';
	newPageHtml += '</div>';
	newPageHtml += '<div data-role="content">';
	newPageHtml += '<div class="' + gridClass + '" style="text-align: center;">';
	//newPageHtml += '<div class="chalk" style="' + divStyle + ';">';
	//newPageHtml += '<div class="chalk">';
	newPageHtml += '<div class="felt">';
	newPageHtml += '<div style="' + divHeaderStyle + ';">';
	// grid headers (dow)
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'a"><strong>'+ dows[i] + '</strong></div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b"><strong>'+ dows[i] + '</strong></div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c"><strong>'+ dows[i] + '</strong></div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd"><strong>'+ dows[i] + '</strong></div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e"><strong>'+ dows[i] + '</strong></div>';
			break;			
		}			
	}
	newPageHtml += '</div>';
	newPageHtml += '<div style="' + divLabelStyle + ';">';
	// breakfast headers
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'a"><i>Breakfast</i></div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b"><i>Breakfast</i></div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c"><i>Breakfast</i></div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd"><i>Breakfast</i></div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e"><i>Breakfast</i></div>';
			break;			
		}			
	}
	newPageHtml += '</div>';
	newPageHtml += '<div style="' + divDataStyle + ';">';
	// breakfast plates
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			//newPageHtml += '<div class="' + columnClass + 'a">'+ breakfastPlates[i] + '</div>';
			newPageHtml += '<div class="' + columnClass + 'a">'+ breakfastPlates[i].name + '</div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b">'+ breakfastPlates[i].name + '</div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c">'+ breakfastPlates[i].name + '</div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd">'+ breakfastPlates[i].name + '</div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e">'+ breakfastPlates[i].name + '</div>';
			break;			
		}			
	}
	newPageHtml += '</div>';
	
	// add breakfast portions
	for (var i = 0; i < len; i++) {
		var typePortions = breakfastPortions[i];
		var typePortion = '&nbsp;';
		for (j = 0; j < typePortions.length; j++) {
			var portion = portions[typePortions[j]];
			if (portion.type == "Grain") {
				typePortion += '<span style="color: #dd7d22;">' + portion.name + '</span>&nbsp;';
			} else	if (portion.type == "Protein") {
				typePortion += '<span style="color: #705b9b;">' + portion.name + '</span>&nbsp;';
			} else	if (portion.type == "Vegetables") {
				typePortion += '<span style="color: #00b65b;">' + portion.name + '</span>&nbsp;';
			} else	if (portion.type == "Fruits") {
				typePortion += '<span style="color: #dc332e;">' + portion.name + '</span>&nbsp;';
			} else	if (portion.type == "Dairy") {
				typePortion += '<span style="color: #4c98d0;">' + portion.name + '</span>&nbsp;';
			}
		}

		switch (i) {
		case 0:
			//newPageHtml += '<div class="' + columnClass + 'a">'+ breakfastPlates[i] + '</div>';
			newPageHtml += '<div class="' + columnClass + 'a">'+ typePortion + '</div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b">'+ typePortion + '</div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c">'+ typePortion + '</div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd">'+ typePortion + '</div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e">'+ typePortion + '</div>';
			break;			
		}			
	}
	
	newPageHtml += '<div style="' + divLabelStyle + ';">';
	// lunch headers
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'a"><i>Lunch</i></div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b"><i>Lunch</i></div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c"><i>Lunch</i></div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd"><i>Lunch</i></div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e"><i>Lunch</i></div>';
			break;			
		}			
	}
	newPageHtml += '</div>';
	newPageHtml += '<div style="' + divDataStyle + ';">';
	// lunch plates
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'a">'+ lunchPlates[i].name + '</div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b">'+ lunchPlates[i].name + '</div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c">'+ lunchPlates[i].name + '</div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd">'+ lunchPlates[i].name + '</div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e">'+ lunchPlates[i].name + '</div>';
			break;			
		}			
	}
	newPageHtml += '</div>';
	
	// add lunch portions
	for (var i = 0; i < len; i++) {
		var typePortions = lunchPortions[i];
		var typePortion = '&nbsp;';
		for (j = 0; j < typePortions.length; j++) {
			var portion = portions[typePortions[j]];
			if (portion.type == "Grain") {
				typePortion += '<span style="color: #dd7d22;">' + portion.name + '</span>&nbsp;';
			} else	if (portion.type == "Protein") {
				typePortion += '<span style="color: #705b9b;">' + portion.name + '</span>&nbsp;';
			} else	if (portion.type == "Vegetables") {
				typePortion += '<span style="color: #00b65b;">' + portion.name + '</span>&nbsp;';
			} else	if (portion.type == "Fruits") {
				typePortion += '<span style="color: #dc332e;">' + portion.name + '</span>&nbsp;';
			} else	if (portion.type == "Dairy") {
				typePortion += '<span style="color: #4c98d0;">' + portion.name + '</span>&nbsp;';
			}
		}

		switch (i) {
		case 0:
			//newPageHtml += '<div class="' + columnClass + 'a">'+ breakfastPlates[i] + '</div>';
			newPageHtml += '<div class="' + columnClass + 'a">'+ typePortion + '</div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b">'+ typePortion + '</div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c">'+ typePortion + '</div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd">'+ typePortion + '</div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e">'+ typePortion + '</div>';
			break;			
		}			
	}
	
	newPageHtml += '<div style="' + divLabelStyle + ';">';
	// dinner headers
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'a"><i>Dinner</i></div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b"><i>Dinner</i></div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c"><i>Dinner</i></div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd"><i>Dinner</i></div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e"><i>Dinner</i></div>';
			break;			
		}			
	}
	newPageHtml += '</div>';
	newPageHtml += '<div style="' + divDataStyle + ';">';
	// dinner plates
	for (var i = 0; i < len; i++) {
		switch (i) {
		case 0:
			newPageHtml += '<div class="' + columnClass + 'a">'+ dinnerPlates[i].name + '</div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b">'+ dinnerPlates[i].name + '</div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c">'+ dinnerPlates[i].name + '</div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd">'+ dinnerPlates[i].name + '</div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e">'+ dinnerPlates[i].name + '</div>';
			break;			
		}			
	}
	newPageHtml += '</div>';
	
	// add dinner portions
	for (var i = 0; i < len; i++) {
		var typePortions = dinnerPortions[i];
		var typePortion = '&nbsp;';
		for (j = 0; j < typePortions.length; j++) {
			var portion = portions[typePortions[j]];
			if (portion.type == "Grain") {
				typePortion += '<span style="color: #dd7d22;">' + portion.name + '</span>&nbsp;';
			} else	if (portion.type == "Protein") {
				typePortion += '<span style="color: #705b9b;">' + portion.name + '</span>&nbsp;';
			} else	if (portion.type == "Vegetables") {
				typePortion += '<span style="color: #00b65b;">' + portion.name + '</span>&nbsp;';
			} else	if (portion.type == "Fruits") {
				typePortion += '<span style="color: #dc332e;">' + portion.name + '</span>&nbsp;';
			} else	if (portion.type == "Dairy") {
				typePortion += '<span style="color: #4c98d0;">' + portion.name + '</span>&nbsp;';
			}
		}

		switch (i) {
		case 0:
			//newPageHtml += '<div class="' + columnClass + 'a">'+ breakfastPlates[i] + '</div>';
			newPageHtml += '<div class="' + columnClass + 'a">'+ typePortion + '</div>';
			break;
		case 1:
			newPageHtml += '<div class="' + columnClass + 'b">'+ typePortion + '</div>';
			break;
		case 2:
			newPageHtml += '<div class="' + columnClass + 'c">'+ typePortion + '</div>';
			break;
		case 3:
			newPageHtml += '<div class="' + columnClass + 'd">'+ typePortion + '</div>';
			break;
		case 4:
			newPageHtml += '<div class="' + columnClass + 'e">'+ typePortion + '</div>';
			break;			
		}			
	}
	
	newPageHtml += '</div>';
	newPageHtml += '</div></div><script type="text/javascript"></script></div>';
	var newPage = $(newPageHtml);
	//add new dialog to page container
	newPage.appendTo($.mobile.pageContainer);
	// enhance and open the new page
    $.mobile.changePage(newPage);
}

function doReport() {
	if (!authenticated)	{
		alert("You must login before using this feature!");
		return;
	}
	//alert("plateSlateCellApp doReport authenticated " + authenticated);
	var thresholdOffset = slateOffsetThreshold;
	var xml = getReportXml('Meal Plan Report', thresholdOffset);
	$.post("../plateslate/storeSlates.php", { xml: xml }, function(msg) {		
		var len = msg.length;
		// need to chop off the %20 chars that were placed onto the msg in lieu of the new line    		
		var crop = len - 4;
		var path = new String(msg);
	//alert("plateslate click path " + path);
		path = path.substring(0, crop);
	//alert("plateslate click chop path " + path);
		var url = '../plateslate/slates2FPDF.php?xml=' + path;
		var patt1=/slate.......xml/gi;
		windowName = msg.match(patt1);
		//alert("plateslate click url " + url + " windowName " + windowName);
		window.open(url, windowName, 'resizable,scrollbars');
	});
}

function getReportXml(name, offset) {
	//alert("plateslate getReportXml name " + name + " offset " + offset);
	//use cache to create xml to be sent to server for the report.
	var cursor = offset;
	//var backwardsCursor = offset - 1;
	var slate;
	var count = 0;
	var maxCount = 7;
	var xml = '<slates accountId="' + loginInfo.id + '" userName="' + loginInfo.userName + '" firstName="' + loginInfo.firstName + '" lastName="' + loginInfo.lastName + '" share="' + plateSelectionShared + '">';
	while (count < maxCount) {
		//alert("plateslate getReportXml count " + count + " cursor " + cursor + " slate name " + slates[cursor].name);
		//alert("plateslate getReportXml forwards count " + count + " cursor " + cursor);
	    if (typeof(slates[cursor]) === 'undefined') {
	    	break;
	    } else {
	    	slate = slates[cursor++];
	    	count++;
	    	xml += getXml(slate);
			//alert("plateslate createReport next cursor " + cursor + " count " + count + " today onwards xml " + xml);
		}		
	}
	cursor = offset - 1;
	while (count < maxCount) {
		//alert("plateslate createReport count " + count + " cursor " + cursor + " slate name " + slates[cursor].name);
		//alert("plateslate createReport backwards count " + count + " cursor " + cursor);
	    if (typeof(slates[cursor]) === 'undefined') {
	    	break;
	    } else {
	    	slate = slates[cursor--];
	    	count++;
	    	xml += getXml(slate);
			//alert("plateslate createReport next cursor " + cursor + " count " + count + " today backwards xml " + xml);
		}		
	}
	
	xml += '</slates>';
	return xml;
}

function getXml(slate) {
	//alert("plateslate getXml slate name " + slate.name + " id " + slate.id + " breakfast id " + slate.breakfastId);
	var xml = '<slate name="' + slate.name + '" dow="' + slate.description + '" id="' + slate.id + '"><plates>';
	var plateId = slate.breakfastId;
	var plate = plates[plateId];
	var portionId;
	var portion;
	var portionsLen;
	portionsLen = slate.breakfastPortions.length;
	//alert("plateslate getXml plate name " + plate.name + " id " + plate.id + " portionsLen " + portionsLen);
	xml += '<plate name="' + plate.name + '" type="Breakfast" description="' + plate.description + '"><portions>';
	//alert("index getXml portionsLen " + portionsLen);
	for (var i = 0; i < portionsLen; i++) {
		portionId = slate.breakfastPortions[i];
		//alert("plateslate getXml portion id " + portionId + " name " + portions[portionId].name + " type " + portions[portionId].type);
		portion = portions[portionId];
		xml += '<portion type="' + portion.type + '">' + portion.name + '</portion>';
	}
	plateId = slate.lunchId;
	plate = plates[plateId];
	xml += '</portions></plate><plate name="' + plate.name + '" type="Lunch" description="' + plate.description + '"><portions>';
	portionsLen = slate.lunchPortions.length;
	for (var i = 0; i < portionsLen; i++) {
		portionId = slate.lunchPortions[i];
		portion = portions[portionId];
		xml += '<portion type="' + portion.type + '">' + portion.name + '</portion>';
	}
	plateId = slate.dinnerId;
	plate = plates[plateId];
	xml += '</portions></plate><plate name="' + plate.name + '" type="Dinner" description="' + plate.description + '"><portions>';
	portionsLen = slate.dinnerPortions.length;
	for (var i = 0; i < portionsLen; i++) {
		portionId = slate.dinnerPortions[i];
		portion = portions[portionId];
		xml += '<portion type="' + portion.type + '">' + portion.name + '</portion>';
	}
	xml += '</portions></plate></plates></slate>';
	//alert("plateslate getXml slate name " + slate.name + " xml " + xml);
	return xml;
}

// tjs 120116
//function getReportGridArrays(thresholdOffset) {
function getReportGridArrays(thresholdOffset, plateCount, plateHistory) {
	//alert("plateslate getReportGridArrays name " + name + " offset " + offset);
	//use cache for the report.
	var cursor = thresholdOffset;
	var slate;
	var count = 0;
	//var maxCount = 5;
	var maxCount = plateCount;
	var dow;
	var dows = new Array();
	var breakfastPlates = new Array();
	var lunchPlates = new Array();
	var dinnerPlates = new Array();
	// tjs 120117
	var breakfastPortions = new Array();
	var lunchPortions = new Array();
	// tjs 120116
	var dinnerPortions = new Array();
	var plateId;
	var plate;
	while (count < maxCount) {
		//alert("plateslate getReportGridArrays count " + count + " cursor " + cursor + " slate name " + slates[cursor].name);
		//alert("plateslate getReportGridArrays forwards count " + count + " cursor " + cursor);
	    if (typeof(slates[cursor]) === 'undefined') {
	    	break;
	    } else {
	    	slate = slates[cursor++];
			//alert("plateslate getReportGridArrays slate name " + slate.name + " description " + slate.description);
	    	dow = getRelativeSlateDescription(slate);
	    	if (dow != null) {
	    		dows.push(dow);
	    	} else {
		    	dows.push(slate.description);
	    	}
	    	plateId = slate.breakfastId;
	    	plate = plates[plateId];
	    	//breakfastPlates.push(plate.name);
	    	breakfastPlates.push(plate);
	    	plateId = slate.lunchId;
	    	plate = plates[plateId];
	    	lunchPlates.push(plate);
	    	plateId = slate.dinnerId;
	    	plate = plates[plateId];
	    	dinnerPlates.push(plate);
	    	// tjs 120116
	    	//dinnerPortions.push(slate.dinnerPortions);
	    	breakfastPortions.push(copyPortions(slate.breakfastPortions));
	    	lunchPortions.push(copyPortions(slate.lunchPortions));
	    	dinnerPortions.push(copyPortions(slate.dinnerPortions));
	    	count++;
			//alert("plateslate createReport next cursor " + cursor + " count " + count + " today onwards xml " + xml);
		}		
	}
	cursor = thresholdOffset - 1;
	//alert("plateSlateCellApp getReportGridArrays count " + count + " thresholdOffset " + thresholdOffset);
	if (count < maxCount) {
		if (!plateHistory)
			// grab one more day from past
			maxCount = count + 1;
		while (count < maxCount) {
			//alert("plateslate createReport count " + count + " cursor " + cursor + " slate name " + slates[cursor].name);
			//alert("plateslate createReport backwards count " + count + " cursor " + cursor);
		    if (typeof(slates[cursor]) === 'undefined') {
		    	break;
		    } else {
		    	slate = slates[cursor--];
		    	count++;
		    	// TODO label one or the other
		    	//dows.unshift("Yesterday/Prior Day");
		    	dow = getRelativeSlateDescription(slate);
		    	if (dow != null) {
			    	dows.unshift(dow);
		    	} else {
			    	dows.unshift("Prior Day");
		    	}
		    	plateId = slate.breakfastId;
		    	plate = plates[plateId];
		    	breakfastPlates.unshift(plate);
		    	plateId = slate.lunchId;
		    	plate = plates[plateId];
		    	lunchPlates.unshift(plate);
		    	plateId = slate.dinnerId;
		    	plate = plates[plateId];
		    	dinnerPlates.unshift(plate);
		    	// tjs 120116
		    	//dinnerPortions.unshift(slate.dinnerPortions);
		    	// tjs 120117
		    	breakfastPortions.unshift(copyPortions(slate.breakfastPortions));
		    	lunchPortions.unshift(copyPortions(slate.lunchPortions));
		    	dinnerPortions.unshift(copyPortions(slate.dinnerPortions));
				//alert("plateslate createReport next cursor " + cursor + " count " + count + " today backwards xml " + xml);
			}		
		}
	}

	var results = new Array();
	results.push(dows);
	results.push(breakfastPlates);
	results.push(lunchPlates);
	results.push(dinnerPlates);
	// tjs 120117
	results.push(breakfastPortions);
	results.push(lunchPortions);
	results.push(dinnerPortions);
	//alert("plateSlateCellApp getReportGridArrays results.length " + results.length);
	return results;
}

// tjs 120221
//'aahfInfo','africanAmerican','american','brazilian','cajun','caribbean','chinese','elderly','french','german','greek',
//'indian','irish','italian','japanese','jewish','mexican','middleEast','multinational','nativeAmerican','polish',
//'portuguese','russian','southern','thai','texmex','vegetarian','other'
function deriveProfileSelectionList() {
	var profileSelectListHtml = '<select name="profileSelection" class="Profile"><optgroup label="Profile">';
	profileSelectListHtml += '<option value ="aahfInfo">AAH Food!</option>';
	profileSelectListHtml += '<option value ="africanAmerican">African American</option>';
	profileSelectListHtml += '<option value ="american">American</option>';
	profileSelectListHtml += '<option value ="brazilian">Brazilian</option>';
	profileSelectListHtml += '<option value ="cajun">Cajun</option>';
	profileSelectListHtml += '<option value ="caribbean">Caribbean</option>';
	profileSelectListHtml += '<option value ="chinese">Chinese</option>';
	profileSelectListHtml += '<option value ="elderly">Elderly</option>';
	profileSelectListHtml += '<option value ="french">French</option>';
	profileSelectListHtml += '<option value ="german">German</option>';
	profileSelectListHtml += '<option value ="greek">Greek</option>';
	profileSelectListHtml += '<option value ="indian">Indian</option>';
	profileSelectListHtml += '<option value ="irish">Irish</option>';
	profileSelectListHtml += '<option value ="italian">Italian</option>';
	profileSelectListHtml += '<option value ="japanese">Japanese</option>';
	profileSelectListHtml += '<option value ="jewish">Jewish</option>';
	profileSelectListHtml += '<option value ="mexican">Mexican</option>';
	profileSelectListHtml += '<option value ="middleEast">Middle East</option>';
	profileSelectListHtml += '<option value ="multinational">Multinational</option>';
	profileSelectListHtml += '<option value ="nativeAmerican">Native American</option>';
	profileSelectListHtml += '<option value ="polish">Polish</option>';
	profileSelectListHtml += '<option value ="portuguese">Portuguese</option>';
	profileSelectListHtml += '<option value ="russian">Russian</option>';
	profileSelectListHtml += '<option value ="southern">Southern</option>';
	profileSelectListHtml += '<option value ="thai">Thai</option>';
	profileSelectListHtml += '<option value ="texmex">Texmex</option>';
	profileSelectListHtml += '<option value ="vegetarian">Vegetarian</option>';
	profileSelectListHtml += '<option value ="other">Other</option>';
	profileSelectListHtml += '</optgroup></select>';
	//alert("plateSlateCellApp deriveProfileSelectionList profileSelectListHtml " + profileSelectListHtml);
	return profileSelectListHtml;
}

function hijaxImportPage() {
	var profileSelections = deriveProfileSelectionList();
	var newPageHtml = '<div data-role="page" data-add-back-btn="true" id="import-page" data-title="Import">';
	//newPageHtml += '<div data-role="header"><h1>Meal Plan Report</h1></div>';
	newPageHtml += '<div data-role="header" data-theme="f" data-position="fixed">';
	newPageHtml += '<a href="index.html" data-icon="home" data-iconpos="notext" data-direction="reverse" class="ui-btn-left jqm-home">Home</a>';
	newPageHtml += '<h1>Imports</h1>';
	newPageHtml += '</div>';
	newPageHtml += '<div data-role="content"><form name="importForm">';
	newPageHtml += '<p style="color: red;">NOTICE: importing a profile shared by another member will clear your slate!</p>';
	newPageHtml += '<p><label for="profile">Profile:</label>' + profileSelections + '</p>';
	newPageHtml += '<p>The profile that you select replaces your plates and the portions that the plates consist of!</p>';
	newPageHtml += '<p>When the import is completed, your slate will be clean but you can immediately use the Slates choice';
	newPageHtml += ' and create plans for meals based upon the newly imported profile!</p>';
	newPageHtml += '<p>If the newly imported profile suits your needs use it as long as you care to.';
	newPageHtml += ' Feel free to alter the plate selections or otherwise tweak the imported profile.</p>';
	newPageHtml += '<p>Note: use <a href:="http://www.plateslate.com">PlateSlate</a> to learn more about profiles or to reach the profile creator';
	newPageHtml += ' (some profile donors are willing to share receipes or have published them.)</p>';
	newPageHtml += '</form>';
	newPageHtml += '<a href="javascript:processImportProfileForm();" data-role="button" data-inline="true">Import Profile</a>';
	newPageHtml += '</div><script type="text/javascript"></script></div>';	
	var newPage = $(newPageHtml);
	//add new dialog to page container
	newPage.appendTo($.mobile.pageContainer);
	// enhance and open the new page
    $.mobile.changePage(newPage);
}

function processImportProfileForm() {
	var profileSelection;
	profileSelection = document.importForm.profileSelection;
	var optionValue = profileSelection.options[profileSelection.selectedIndex].value;
	doRestoreFromBackup(loginAccountNumber, optionValue);
}

// tjs 120216
function loadPreferences() {
	//alert("plateslate start loadPreferences preferences.plateSelectionRandom " + preferences.plateSelectionRandom + " preferences.plateSelectionSeasonal " + preferences.plateSelectionSeasonal + " preferences.plateSelectionShared " + preferences.plateSelectionShared);
	var tempPreferences = JSON.parse(localStorage.getItem('preferences'));
	//if (typeof(tempPreferences !== 'undefined')  && tempPreferences != null) {
	// tjs 120119
	if (typeof(tempPreferences) !== 'undefined'  && tempPreferences != null) {
		//alert("plateslate loadPreferences tempPreferences.plateSelectionRandom " + tempPreferences.plateSelectionRandom + " tempPreferences.plateSelectionSeasonal " + tempPreferences.plateSelectionSeasonal + " tempPreferences.plateSelectionShared " + tempPreferences.plateSelectionShared);
		preferences.plateSelectionRandom = tempPreferences.plateSelectionRandom;
		preferences.plateSelectionSeasonal = tempPreferences.plateSelectionSeasonal;
		preferences.plateSelectionShared = tempPreferences.plateSelectionShared;
		preferences.slateMealPlansForDinnerOnly = tempPreferences.slateMealPlansForDinnerOnly;
		//if (typeof(tempPreferences.refreshDataFromServerDefault) !== 'undefined'  && tempPreferences.refreshDataFromServerDefault != null) {
			preferences.refreshDataFromServerDefault = tempPreferences.refreshDataFromServerDefault;
		//} else {
		//	preferences.refreshDataFromServerDefault = false;	
		//}
		//if (typeof(tempPreferences.backupDataToServer) !== 'undefined'  && tempPreferences.backupDataToServer != null) {
			preferences.backupDataToServer = tempPreferences.backupDataToServer;
		//} else {
		//	preferences.backupDataToServer = false;	
		//}
		plateSelectionRandom = preferences.plateSelectionRandom;
		plateSelectionSeasonal = preferences.plateSelectionSeasonal;
		plateSelectionShared = preferences.plateSelectionShared;
		slateMealPlansForDinnerOnly = preferences.slateMealPlansForDinnerOnly;
		refreshDataFromServerDefault = preferences.refreshDataFromServerDefault;
		backupDataToServer = preferences.backupDataToServer;
	}
	//alert("plateslate end loadPreferences preferences.plateSelectionRandom " + preferences.plateSelectionRandom + " preferences.plateSelectionSeasonal " + preferences.plateSelectionSeasonal + " preferences.plateSelectionShared " + preferences.plateSelectionShared + " preferences.slateMealPlansForDinnerOnly " + preferences.slateMealPlansForDinnerOnly + " preferences.refreshDataFromServerDefault " + preferences.refreshDataFromServerDefault + " preferences.backupDataToServer " + preferences.backupDataToServer);
}

function openSlatePlansPage() {
	if (slateMealPlansForDinnerOnly) {
		hijaxDinnerPage();
	} else {
		hijaxBreakfastPage();
	}
}

function hijaxBreakfastPage(direction) {
	var transition = 'slide';
	var reverse = false;
	if (direction != null) {
		if (direction == 'reverse')
			reverse = true;
		else 
			transition = direction;
	}
		
	// derive dynamic html content
    var offset = color/20;
    //TODO fix
    var mealName = "Breakfast";
    //alert("breakfast ready color " + color + " offset " + offset);
    var mealHtml = getSlateView(offset, mealName);

    // create page markup
    // tjs 120117
	//var newPageHtml = '<div data-role="page" id="breakfast-page" data-title="Breakfast" class="type-interior" data-theme="b" data-dom-cache="false">';
	var newPageHtml = '<div data-role="page" id="breakfast-page" data-title="Breakfast" class="type-interior" data-theme="b" data-dom-cache="true">';
	newPageHtml += '<div data-role="header" data-theme="f" data-position="fixed">';
	newPageHtml += '<a href="index.html" data-icon="home" data-iconpos="notext" data-direction="reverse" class="ui-btn-left jqm-home">Home</a>';
	newPageHtml += '<h1>Breakfast</h1>';
	newPageHtml += '</div><div data-role="content"><div class="content-primary">';
	newPageHtml += mealHtml;
	newPageHtml += '</div></div>';
	newPageHtml += '<div data-role="footer" data-id="foo1" data-position="fixed"><div data-role="navbar"><ul>';
	newPageHtml += '<li><a href="javascript:previousBreakfast();">Prev</a></li>';
	newPageHtml += '<li><a href="javascript:hijaxBreakfastPage();" class="ui-btn-active ui-state-persist">Breakfast</a></li>';
	newPageHtml += '<li><a href="javascript:hijaxLunchPage(' + "'slideup'" + ');">Lunch</a></li>';
	newPageHtml += '<li><a href="javascript:hijaxDinnerPage(' + "'slideup'" + ');">Dinner</a></li>';
	newPageHtml += '<li><a href="javascript:nextBreakfast();">Next</a></li>';
	newPageHtml += '</ul></div><!-- /navbar --></div><!-- /footer --></div>';
	var newPage = $(newPageHtml);
	//add new page to page container
	newPage.appendTo($.mobile.pageContainer);
	
	// tweak the new page just added into the dom
// enhance and open the new page
     $.mobile.changePage(newPage, {transition: transition, reverse: reverse });			
}

function hijaxLunchPage(direction) {
	var transition = 'slide';
	var reverse = false;
	if (direction != null) {
		if (direction == 'reverse')
			reverse = true;
		else 
			transition = direction;
	}
	// derive dynamic html content
    var offset = color/20;
    //TODO fix
    var mealName = "Lunch";
    //alert("breakfast ready color " + color + " offset " + offset);
    var mealHtml = getSlateView(offset, mealName);

	// create page markup
	var newPageHtml = '<div data-role="page" id="lunch-page" data-title="Lunch" class="type-interior" data-theme="b" data-dom-cache="true">';
	newPageHtml += '<div data-role="header" data-theme="f" data-position="fixed">';
	newPageHtml += '<h1>Lunch</h1>';
	newPageHtml += '<a href="index.html" data-icon="home" data-iconpos="notext" data-direction="reverse" class="ui-btn-left jqm-home">Home</a>';
	newPageHtml += '</div><div data-role="content"><div class="content-primary">';
	newPageHtml += mealHtml;
	newPageHtml += '</div></div>';
	newPageHtml += '<div data-role="footer" data-id="foo1" data-position="fixed"><div data-role="navbar"><ul>';
	newPageHtml += '<li><a href="javascript:previousLunch();">Prev</a></li>';
	newPageHtml += '<li><a href="javascript:hijaxBreakfastPage(' + "'slidedown'" + ');">Breakfast</a></li>';
	newPageHtml += '<li><a href="javascript:hijaxLunchPage();" class="ui-btn-active ui-state-persist">Lunch</a></li>';
	newPageHtml += '<li><a href="javascript:hijaxDinnerPage(' + "'slideup'" + ');">Dinner</a></li>';
	newPageHtml += '<li><a href="javascript:nextLunch();">Next</a></li>';
	newPageHtml += '</ul></div><!-- /navbar --></div><!-- /footer --></div>';
	var newPage = $(newPageHtml);
	//add new page to page container
	newPage.appendTo($.mobile.pageContainer);
	/*
	// tweak the new page just added into the dom
    */
// enhance and open the new page
     $.mobile.changePage(newPage, {transition: transition, reverse: reverse });			
}

function hijaxDinnerPage(direction) {
	var transition = 'slide';
	var reverse = false;
	if (direction != null) {
		if (direction == 'reverse')
			reverse = true;
		else 
			transition = direction;
	}
	// derive dynamic html content
    var offset = color/20;
    //TODO fix
    var mealName = "Dinner";
    //alert("breakfast ready color " + color + " offset " + offset);
    var mealHtml = getSlateView(offset, mealName);

    // create page markup
	var newPageHtml = '<div data-role="page" id="dinner-page" data-title="Dinner" class="type-interior" data-theme="b" data-dom-cache="true">';
	newPageHtml += '<div data-role="header" data-theme="f" data-position="fixed">';
	newPageHtml += '<h1>Dinner</h1>';
	newPageHtml += '<a href="index.html" data-icon="home" data-iconpos="notext" data-direction="reverse" class="ui-btn-left jqm-home">Home</a>';
	newPageHtml += '</div><div data-role="content"><div class="content-primary">';
	newPageHtml += mealHtml;
	newPageHtml += '</div></div>';
	newPageHtml += '<div data-role="footer" data-id="foo1" data-position="fixed"><div data-role="navbar"><ul>';
	newPageHtml += '<li><a href="javascript:previousDinner();">Prev</a></li>';
	newPageHtml += '<li><a href="javascript:hijaxBreakfastPage(' + "'slidedown'" + ');">Breakfast</a></li>';
	newPageHtml += '<li><a href="javascript:hijaxLunchPage(' + "'slidedown'" + ');">Lunch</a></li>';
	newPageHtml += '<li><a href="javascript:hijaxDinnerPage();" class="ui-btn-active ui-state-persist">Dinner</a></li>';
	newPageHtml += '<li><a href="javascript:nextDinner();">Next</a></li>';
	newPageHtml += '</ul></div><!-- /navbar --></div><!-- /footer --></div>';
	var newPage = $(newPageHtml);
	//add new page to page container
	newPage.appendTo($.mobile.pageContainer);
	
	// tweak the new page just added into the dom
    
// enhance and open the new page
    $.mobile.changePage(newPage, {transition: transition, reverse: reverse });
}

function previousBreakfast() {
	color -= 20;
	hijaxBreakfastPage('reverse');
}

function nextBreakfast() {
	color += 20;
	hijaxBreakfastPage();	
}

function previousLunch() {
	color -= 20;
	hijaxLunchPage('reverse');
}

function nextLunch() {
	color += 20;
	hijaxLunchPage();	
}

function previousDinner() {
	color -= 20;
	hijaxDinnerPage('reverse');
}

function nextDinner() {
	color += 20;
	hijaxDinnerPage();	
}

function processAddNewPortionForm(portionType) {
	//alert("plateslate processAddNewPortionForm portionType " + portionType);
	var offset;
	var mealName;
	// tjs 120223
	var isSlate;
	var portionSelection;
	if (portionType == "grain") {
		offset = Number(document.newGrainPortionForm.slateOffset.value);
		mealName = document.newGrainPortionForm.mealName.value;
		// tjs 120223
		isSlate = document.newGrainPortionForm.isSlate.value;
		portionSelection = document.newGrainPortionForm.portionSelection;
	} else if (portionType == "protein") {
		offset = Number(document.newProteinPortionForm.slateOffset.value);
		mealName = document.newProteinPortionForm.mealName.value;
		isSlate = document.newProteinPortionForm.isSlate.value;
		portionSelection = document.newProteinPortionForm.portionSelection;
	} else if (portionType == "vegetables") {
		offset = Number(document.newVegetablesPortionForm.slateOffset.value);
		mealName = document.newVegetablesPortionForm.mealName.value;
		isSlate = document.newVegetablesPortionForm.isSlate.value;
		portionSelection = document.newVegetablesPortionForm.portionSelection;
	} else if (portionType == "fruits") {
		offset = Number(document.newFruitsPortionForm.slateOffset.value);
		mealName = document.newFruitsPortionForm.mealName.value;
		isSlate = document.newFruitsPortionForm.isSlate.value;
		portionSelection = document.newFruitsPortionForm.portionSelection;
	} else if (portionType == "dairy") {
		offset = Number(document.newDairyPortionForm.slateOffset.value);
		mealName = document.newDairyPortionForm.mealName.value;
		isSlate = document.newDairyPortionForm.isSlate.value;
		portionSelection = document.newDairyPortionForm.portionSelection;
	}
		
	var optionValue = portionSelection.options[portionSelection.selectedIndex].value;
	//alert("plateslate processAddNewPortionForm offset " + offset + " mealName " + mealName + " optionValue " + optionValue);

	// tjs 120223
	//if (offset < 1000) { // i.e. if working with slate edits of portions
	if (isSlate > 0) { // i.e. if working with slate edits of portions
		var thresholdOffset = offset + slateOffsetThreshold;
		//alert("plateslate processAddNewPortionForm thresholdOffset " + thresholdOffset);
		// e.g. offset 0 means 100
		
		var slate = slates[thresholdOffset];
		var slateId = slate.id;	
		updateFood(slateId, mealName, optionValue, 0, 0);
	} else { // i.e. working with plate edits of portions
		//alert("plateslate processAddNewPortionForm offset " + offset + " mealName " + mealName + " optionValue " + optionValue);
		//var index = offset - 1000;
		var index = offset;
		var dish = plates[index];
		var existingPortions = new Array();
		if (dish.portion1 != null && dish.portion1 > 0)
			existingPortions.push(dish.portion1);
		if (dish.portion2 != null && dish.portion2 > 0)
			existingPortions.push(dish.portion2);
		if (dish.portion3 != null && dish.portion3 > 0)
			existingPortions.push(dish.portion3);
		if (dish.portion4 != null && dish.portion4 > 0)
			existingPortions.push(dish.portion4);
		if (dish.portion5 != null && dish.portion5 > 0)
			existingPortions.push(dish.portion5);
		if (dish.portion6 != null && dish.portion6 > 0)
			existingPortions.push(dish.portion6);
		if (dish.portion7 != null && dish.portion7 > 0)
			existingPortions.push(dish.portion7);
		if (dish.portion8 != null && dish.portion8 > 0)
			existingPortions.push(dish.portion8);
		if (dish.portion9 != null && dish.portion9 > 0)
			existingPortions.push(dish.portion9);
		var okToAdd = true;
		var count = 0;
		//alert("plateslate processAddNewPortionForm existingPortions.length " + existingPortions.length);
		for (var i = 0; i < existingPortions.length; i++) {
			if (existingPortions[i] == optionValue) {
				okToAdd = false;
				break;
			}
			count++;
		}
		//alert("plateslate processAddNewPortionForm okToAdd " + okToAdd + " count " + count);
		if (okToAdd && count < 9) {
			count++;
			switch (count) {
			case 1:
				dish.portion1 = optionValue;
				break;
			case 2:
				dish.portion2 = optionValue;
				break;
			case 3:
				dish.portion3 = optionValue;
				break;
			case 4:
				dish.portion4 = optionValue;
				break;
			case 5:
				dish.portion5 = optionValue;
				break;
			case 6:
				dish.portion6 = optionValue;
				break;
			case 7:
				dish.portion7 = optionValue;
				break;
			case 8:
				dish.portion8 = optionValue;
				break;
			case 9:
				dish.portion9 = optionValue;
				break;
			}
			addToPlate(dish);
		}
	}
	
	var chalkColor = 0;
	var portionName;
	var newPortionHtml;
	var partialNewPortionHtml;
	//if (offset < 1000) {
	if (isSlate > 0) {
		chalkColor = makeColor(color);
		portionName = portions[optionValue].name;
		partialNewPortionHtml = '<a href="javascript:dropPortion(0 , ' + "'" + mealName + "'" + ', ' + optionValue + ');" data-role="button" data-icon="delete" data-iconpos="right" data-theme="a"><span class="chalk" style="color:' + chalkColor + '">' + portionName + '</span></a>';
		aHref = 'href="javascript:dropPortion(0 , ' + "'" + mealName + "'" + ', ' + optionValue + ');"';
		spanStyle = 'color:' + chalkColor;
	}

	if (portionType == "grain") {
		$('#grain-portion-dial').dialog('close');
		//if (offset < 1000){
		if (isSlate > 0){
			var dividerId = '#grain' + mealName;
			if  (mealName == "Breakfast") {
				newPortionHtml = '<li  class="grainPortion">' + partialNewPortionHtml;
				//alert("plateSlateCellApp processAddNewPortionForm mealName " + mealName + " newPortionHtml " + newPortionHtml + " dividerId " + dividerId);
				//alert("plateSlateCellApp processAddNewPortionForm mealName " + mealName + " newPortionHtml added using dividerId " + dividerId);
				//	alert("plateSlateCellApp processAddNewPortionForm mealName " + mealName + " newPortionHtml added using dividerId " + dividerId);
				// per model
				$(dividerId).after($('<li/>', {    //here after id'd 'li' and new `<li>`
				    'class': "grainPortion"
				}).append($('<a/>', {    //here appending `<a>` into `<li>`
				    'href': aHref,
				    'data-role': 'button',
				    'data-icon': 'delete',
				    'data-theme': 'a'
				}).append($('<span/>', { //here appending `<span>` into `<a>
					'class': 'chalk',
					'style': spanStyle
				}).append($(portionName)) // here appending text into the span
				)));
				//alert("plateSlateCellApp processAddNewPortionForm mealName " + mealName + " using dividerId " + dividerId + " href " + aHref + " name " + portionName);
				//try {
				//	$('#breakfast-page ul').listview('refresh');
				//} catch (e) {
				//	$('#breakfast-page ul').listview();
				//}
			} else if (mealName == "Lunch") {
				$('#lunch-page ul').listview('refresh');
			} else if (mealName == "Dinner") {
				$('#dinner-page ul').listview('refresh');
			}
		}
		//alert("plateSlateCellApp processAddNewPortionForm mealName " + mealName);
	} else if (portionType == "protein") {
		$('#protein-portion-dial').dialog('close');
	} else if (portionType == "vegetables") {
		$('#vegetables-portion-dial').dialog('close');
	} else if (portionType == "fruits") {
		$('#fruits-portion-dial').dialog('close');
	} else if (portionType == "dairy") {
		$('#dairy-portion-dial').dialog('close');
	}
}

function cancelAddNewPortionForm(portionType) {
	//alert("plateslate cancelAddNewPortionForm portionType " + portionType);
	var offset;
	var mealName;
	if (portionType == "grain") {
		$('#grain-portion-dial').dialog('close');
	} else if (portionType == "protein") {
		$('#protein-portion-dial').dialog('close');
	} else if (portionType == "vegetables") {
		$('#vegetables-portion-dial').dialog('close');
	} else if (portionType == "fruits") {
		$('#fruits-portion-dial').dialog('close');
	} else if (portionType == "dairy") {
		$('#dairy-portion-dial').dialog('close');
	}
}

// TODO use html for each portion to build select via filtering out those in the lists
// tjs 120228 this is altered to filter out portions already selected for the plate
//function derivePortionSelectionLists(slateTorf) {
function derivePortionSelectionLists(preSelectedPortions) {
	grainPortionSelectListHtml = '<select name="portionSelection" class="Grain"><optgroup label="Grain">';
	proteinPortionSelectListHtml = '<select name="portionSelection" class="Protein"><optgroup label="Protein">';
	vegetablesPortionSelectListHtml = '<select name="portionSelection" class="Vegetables"><optgroup label="Vegetables">';
	fruitsPortionSelectListHtml = '<select name="portionSelection" class="Fruits"><optgroup label="Fruits">';
	dairyPortionSelectListHtml = '<select name="portionSelection" class="Dairy"><optgroup label="Dairy">';
	
	var len = portions.length;
	if (len > 0) {
		for (var i = 0; i < len; i++) {
			//alert("plateslate populatePlateMenus i " + i);
			if (i in portions) {
				var currentPortion = portions[i];
				if (currentPortion != null) {
					var currentPortionId = currentPortion.id;
					var isPreSelected = false;
					for (var j = 0; j < preSelectedPortions.length; j++) {
						if (currentPortionId == preSelectedPortions[j]) {
							isPreSelected = true;
							break;
						}
					}
					if (isPreSelected == false) {
					//TODO if (currentPlate.master == 1)
					//alert("plateslate updatePortionsDialogs portion type " + currentPortion.type + " portion name " + currentPortion.name);
						if (currentPortion.type == "Grain") {
							grainPortionSelectListHtml += '<option value ="' + currentPortion.id + '">' + currentPortion.name + '</option>';
						} else if (currentPortion.type == "Protein") {
							proteinPortionSelectListHtml += '<option value ="' + currentPortion.id +'">' + currentPortion.name + '</option>';
						} else if (currentPortion.type == "Vegetables") {
							vegetablesPortionSelectListHtml += '<option value ="' + currentPortion.id +'">' + currentPortion.name + '</option>';
						} else if (currentPortion.type == "Fruits") {
							fruitsPortionSelectListHtml += '<option value ="' + currentPortion.id +'">' + currentPortion.name + '</option>';
						} else if (currentPortion.type == "Dairy") {
							dairyPortionSelectListHtml += '<option value ="' + currentPortion.id +'">' + currentPortion.name + '</option>';
						}
					}
				}
			}
		}

		/*
		for (var i = 0; i < len; i++) {
			//alert("plateslate populatePlateMenus i " + i);
			var currentPortion = portions[i];
			if (currentPortion != null) {
				//TODO if (currentPlate.master == 1)
				//alert("plateslate updatePortionsDialogs portion type " + currentPortion.type + " portion name " + currentPortion.name);
				if (currentPortion.type == "Grain") {
					grainPortionSelectListHtml += '<option value ="' + currentPortion.id + '">' + currentPortion.name + '</option>';
				} else if (currentPortion.type == "Protein") {
					proteinPortionSelectListHtml += '<option value ="' + currentPortion.id +'">' + currentPortion.name + '</option>';
				} else if (currentPortion.type == "Vegetables") {
					vegetablesPortionSelectListHtml += '<option value ="' + currentPortion.id +'">' + currentPortion.name + '</option>';
				} else if (currentPortion.type == "Fruits") {
					fruitsPortionSelectListHtml += '<option value ="' + currentPortion.id +'">' + currentPortion.name + '</option>';
				} else if (currentPortion.type == "Dairy") {
					dairyPortionSelectListHtml += '<option value ="' + currentPortion.id +'">' + currentPortion.name + '</option>';
				}
			}
		}
		*/
		grainPortionSelectListHtml += '</optgroup></select>';
		proteinPortionSelectListHtml += '</optgroup></select>';
		vegetablesPortionSelectListHtml += '</optgroup></select>';
		fruitsPortionSelectListHtml += '</optgroup></select>';
		dairyPortionSelectListHtml += '</optgroup></select>';
	}
	//alert("plateslate derivePortionSelectionLists grainPortionSelectListHtml " + grainPortionSelectListHtml);
}

function processAddNewPortion(offset, mealName, portionType, optionValue) {
	//alert("plateslate processAddNewPortion offset " + offset + " mealName " + mealName + " portionType " + portionType + " optionValue " + optionValue);

	var slate;
	var slateId;
	// tjs 120223
	//if (offset < 1000) { // i.e. if working with slate edits of portions
		var thresholdOffset = offset + slateOffsetThreshold;
		//alert("plateslate processAddNewPortionForm thresholdOffset " + thresholdOffset);
		// e.g. offset 0 means 100
		
		slate = slates[thresholdOffset];
		slateId = slate.id;	
		updateFood(slateId, mealName, optionValue, 0, 0);
	/*} else { // i.e. working with plate edits of portions
		//alert("plateslate processAddNewPortionForm offset " + offset + " mealName " + mealName + " optionValue " + optionValue);
		var index = offset - 1000;
		var dish = plates[index];
		var existingPortions = new Array();
		if (dish.portion1 != null && dish.portion1 > 0)
			existingPortions.push(dish.portion1);
		if (dish.portion2 != null && dish.portion2 > 0)
			existingPortions.push(dish.portion2);
		if (dish.portion3 != null && dish.portion3 > 0)
			existingPortions.push(dish.portion3);
		if (dish.portion4 != null && dish.portion4 > 0)
			existingPortions.push(dish.portion4);
		if (dish.portion5 != null && dish.portion5 > 0)
			existingPortions.push(dish.portion5);
		if (dish.portion6 != null && dish.portion6 > 0)
			existingPortions.push(dish.portion6);
		if (dish.portion7 != null && dish.portion7 > 0)
			existingPortions.push(dish.portion7);
		if (dish.portion8 != null && dish.portion8 > 0)
			existingPortions.push(dish.portion8);
		if (dish.portion9 != null && dish.portion9 > 0)
			existingPortions.push(dish.portion9);
		var okToAdd = true;
		var count = 0;
		//alert("plateslate processAddNewPortionForm existingPortions.length " + existingPortions.length);
		for (var i = 0; i < existingPortions.length; i++) {
			if (existingPortions[i] == optionValue) {
				okToAdd = false;
				break;
			}
			count++;
		}
		//alert("plateslate processAddNewPortionForm okToAdd " + okToAdd + " count " + count);
		if (okToAdd && count < 9) {
			count++;
			switch (count) {
			case 1:
				dish.portion1 = optionValue;
				break;
			case 2:
				dish.portion2 = optionValue;
				break;
			case 3:
				dish.portion3 = optionValue;
				break;
			case 4:
				dish.portion4 = optionValue;
				break;
			case 5:
				dish.portion5 = optionValue;
				break;
			case 6:
				dish.portion6 = optionValue;
				break;
			case 7:
				dish.portion7 = optionValue;
				break;
			case 8:
				dish.portion8 = optionValue;
				break;
			case 9:
				dish.portion9 = optionValue;
				break;
			}
			addToPlate(dish);
		}
	}*/
	
	//  update cache
	//if (offset < 1000) {
		refreshSlatePortionCache(slate, mealName, optionValue);
	//}
}

function refreshSlatePortionCache(slate, mealName, optionValue) {
	var typePortions;
	if  (mealName == "Breakfast") {
		typePortions = slate.breakfastPortions;
	} else if (mealName == "Lunch") {
		typePortions = slate.lunchPortions;
	} else if (mealName == "Dinner") {
		typePortions = slate.dinnerPortions;
	}
	var index = 0;
	var portionExists = false;
	for (var i = 0; i < typePortions.length; i++) {
		if (typePortions[i] == optionValue) {
			portionExists = true;
			break;
		}
		index++;
	}
	if (!portionExists) {
		if  (mealName == "Breakfast") {
			slate.breakfastPortions[index] = optionValue;
			hijaxBreakfastPage('fade');
		} else if (mealName == "Lunch") {
			slate.lunchPortions[index] = optionValue;
			hijaxLunchPage('fade');
		} else if (mealName == "Dinner") {
			slate.dinnerPortions[index] = optionValue;
			hijaxDinnerPage('fade');
		}
	}
}

// tjs 120223
//function hijaxGrainSelectionDial(offset, mealName) {
function hijaxGrainSelectionDial(offset, mealName, torf) {
	//alert("plateslate hijaxGrainSelectionDial offset " + offset + " mealName " + mealName);
	//alert("plateslate hijaxGrainSelectionDial offset " + offset + " mealName " + mealName + " grainPortionSelectListHtml " + grainPortionSelectListHtml);
	var newDialHtml = '<div data-role="dialog" id="grain-portion-dial" data-rel="dialog"><div data-role="header">';
	newDialHtml += '<h1>Add New Grain Portion</h1></div>';	
	newDialHtml += '<div data-role="content" data-theme="c">';	
	//newDialHtml += '<form name="newGrainPortionForm"><input type="hidden" name="slateOffset" /><input type="hidden" name="portionName" />';
	newDialHtml += '<form name="newGrainPortionForm"><input type="hidden" name="slateOffset" /><input type="hidden" name="portionName" /><input type="hidden" name="isSlate" />';
	newDialHtml += '<p>Add New Grain Portion...</p><p/>';
	newDialHtml += '<p><label for="mealName">Meal:</label><input type="text" name="mealName" id="name" readonly="readonly" data-theme="d"/></p>';
	newDialHtml += '<p><label for="name">Grain:</label>' + grainPortionSelectListHtml + '</p>';
	newDialHtml += '</form><br><br><a href="javascript:cancelAddNewPortionForm(' + "'grain'" + ');" data-role="button" data-inline="true" data-theme="a">Cancel</a>';		
	newDialHtml += '<a href="javascript:processAddNewPortionForm(' + "'grain'" + ');" data-role="button" data-inline="true">Add New Portion</a>';
	newDialHtml += '</div><script></script></div>';
	var newDial = $(newDialHtml);
	//add new dialog to page container
	newDial.appendTo($.mobile.pageContainer);
	
	// tweak the new dialog just added into the dom
 	document.newGrainPortionForm.slateOffset.value = offset;
	document.newGrainPortionForm.mealName.value = mealName;
	if (torf)
		document.newGrainPortionForm.isSlate.value = 1;
	else
		document.newGrainPortionForm.isSlate.value = 0;
	
	// enhance and open the new dialog
    $.mobile.changePage(newDial);
}

function hijaxProteinSelectionDial(offset, mealName, torf) {
	//alert("plateslate hijaxProteinSelectionDial offset " + offset + " mealName " + mealName + " grainPortionSelectListHtml " + grainPortionSelectListHtml);
	var newDialHtml = '<div data-role="dialog" id="protein-portion-dial"><div data-role="header">';
	newDialHtml += '<h1>Add New Protein Portion</h1></div>';	
	newDialHtml += '<div data-role="content" data-theme="c">';	
	newDialHtml += '<form name="newProteinPortionForm"><input type="hidden" name="slateOffset" /><input type="hidden" name="portionName" /><input type="hidden" name="isSlate" />';
	newDialHtml += '<p>Add New Protein Portion...</p><p/>';
	newDialHtml += '<p><label for="mealName">Meal:</label><input type="text" name="mealName" id="name" readonly="readonly" data-theme="d"/></p>';
	newDialHtml += '<p><label for="name">Protein:</label>' + proteinPortionSelectListHtml + '</p>';
	newDialHtml += '</form><br><br><a href="javascript:cancelAddNewPortionForm(' + "'protein'" + ');" data-role="button" data-inline="true" data-theme="a">Cancel</a>';		
	newDialHtml += '<a href="javascript:processAddNewPortionForm(' + "'protein'" + ');" data-role="button" data-inline="true">Add New Portion</a>';
	newDialHtml += '</div><script></script></div>';
	var newDial = $(newDialHtml);
	//add new dialog to page container
	newDial.appendTo($.mobile.pageContainer);
	
	// tweak the new dialog just added into the dom
 	document.newProteinPortionForm.slateOffset.value = offset;
	document.newProteinPortionForm.mealName.value = mealName;
	if (torf)
		document.newProteinPortionForm.isSlate.value = 1;
	else
		document.newProteinPortionForm.isSlate.value = 0;
   
	// enhance and open the new dialog
    $.mobile.changePage(newDial);
}

function hijaxVegetablesSelectionDial(offset, mealName, torf) {
	var newDialHtml = '<div data-role="dialog" id="vegetables-portion-dial"><div data-role="header">';
	newDialHtml += '<h1>Add New Vegetable Portion</h1></div>';	
	newDialHtml += '<div data-role="content" data-theme="c">';	
	newDialHtml += '<form name="newVegetablesPortionForm"><input type="hidden" name="slateOffset" /><input type="hidden" name="portionName" /><input type="hidden" name="isSlate" />';
	newDialHtml += '<p>Add New Vegetable Portion...</p><p/>';
	newDialHtml += '<p><label for="mealName">Meal:</label><input type="text" name="mealName" id="name" readonly="readonly" data-theme="d"/></p>';
	newDialHtml += '<p><label for="name">Vegetable:</label>' + vegetablesPortionSelectListHtml + '</p>';
	newDialHtml += '</form><br><br><a href="javascript:cancelAddNewPortionForm(' + "'vegetables'" + ');" data-role="button" data-inline="true" data-theme="a">Cancel</a>';		
	newDialHtml += '<a href="javascript:processAddNewPortionForm(' + "'vegetables'" + ');" data-role="button" data-inline="true">Add New Portion</a>';
	newDialHtml += '</div><script></script></div>';
	var newDial = $(newDialHtml);
	//add new dialog to page container
	newDial.appendTo($.mobile.pageContainer);
	
	// tweak the new dialog just added into the dom
 	document.newVegetablesPortionForm.slateOffset.value = offset;
	document.newVegetablesPortionForm.mealName.value = mealName;
	if (torf)
		document.newVegetablesPortionForm.isSlate.value = 1;
	else
		document.newVegetablesPortionForm.isSlate.value = 0;
   
	// enhance and open the new dialog
    $.mobile.changePage(newDial);
}

function hijaxFruitsSelectionDial(offset, mealName, torf) {
	var newDialHtml = '<div data-role="dialog" id="fruits-portion-dial"><div data-role="header">';
	newDialHtml += '<h1>Add New Fruit Portion</h1></div>';	
	newDialHtml += '<div data-role="content" data-theme="c">';	
	newDialHtml += '<form name="newFruitsPortionForm"><input type="hidden" name="slateOffset" /><input type="hidden" name="portionName" /><input type="hidden" name="isSlate" />';
	newDialHtml += '<p>Add New Fruit Portion...</p><p/>';
	newDialHtml += '<p><label for="mealName">Meal:</label><input type="text" name="mealName" id="name" readonly="readonly" data-theme="d"/></p>';
	newDialHtml += '<p><label for="name">Fruit:</label>' + fruitsPortionSelectListHtml + '</p>';
	newDialHtml += '</form><br><br><a href="javascript:cancelAddNewPortionForm(' + "'fruits'" + ');" data-role="button" data-inline="true" data-theme="a">Cancel</a>';		
	newDialHtml += '<a href="javascript:processAddNewPortionForm(' + "'fruits'" + ');" data-role="button" data-inline="true">Add New Portion</a>';
	newDialHtml += '</div><script></script></div>';
	var newDial = $(newDialHtml);
	//add new dialog to page container
	newDial.appendTo($.mobile.pageContainer);
	
	// tweak the new dialog just added into the dom
 	document.newFruitsPortionForm.slateOffset.value = offset;
	document.newFruitsPortionForm.mealName.value = mealName;
	if (torf)
		document.newFruitsPortionForm.isSlate.value = 1;
	else
		document.newFruitsPortionForm.isSlate.value = 0;
   
	// enhance and open the new dialog
    $.mobile.changePage(newDial);
}

function hijaxDairySelectionDial(offset, mealName, torf) {
	var newDialHtml = '<div data-role="dialog" id="dairy-portion-dial"><div data-role="header">';
	newDialHtml += '<h1>Add New Dairy Portion</h1></div>';	
	newDialHtml += '<div data-role="content" data-theme="c">';	
	newDialHtml += '<form name="newDairyPortionForm"><input type="hidden" name="slateOffset" /><input type="hidden" name="portionName" /><input type="hidden" name="isSlate" />';
	newDialHtml += '<p>Add New Dairy Portion...</p><p/>';
	newDialHtml += '<p><label for="mealName">Meal:</label><input type="text" name="mealName" id="name" readonly="readonly" data-theme="d"/></p>';
	newDialHtml += '<p><label for="name">Dairy:</label>' + dairyPortionSelectListHtml + '</p>';
	newDialHtml += '</form><br><br><a href="javascript:cancelAddNewPortionForm(' + "'dairy'" + ');" data-role="button" data-inline="true" data-theme="a">Cancel</a>';		
	newDialHtml += '<a href="javascript:processAddNewPortionForm(' + "'dairy'" + ');" data-role="button" data-inline="true">Add New Portion</a>';
	newDialHtml += '</div><script></script></div>';
	var newDial = $(newDialHtml);
	//add new dialog to page container
	newDial.appendTo($.mobile.pageContainer);
	
	// tweak the new dialog just added into the dom
 	document.newDairyPortionForm.slateOffset.value = offset;
	document.newDairyPortionForm.mealName.value = mealName;
	if (torf)
		document.newDairyPortionForm.isSlate.value = 1;
	else
		document.newDairyPortionForm.isSlate.value = 0;
   
	// enhance and open the new dialog
    $.mobile.changePage(newDial);
}

function dropPortion(plateIndex, mealName, portionId) {
	//alert("plateslate dropPortion mealName " + mealName + " portionId " + portionId);
	if (plateIndex == 0) {
	    var offset = color/20;
		var thresholdOffset = offset + slateOffsetThreshold;
		var slate = slates[thresholdOffset];
		var slateId = slate.id;
		// make the portioninactive...
		updateFood(slateId, mealName, portionId, 0, 1);
	} else {
		var dish = plates[plateIndex];
		if (dish.portion1 == portionId)
			dish.portion1 = 0;
		else if (dish.portion2 == portionId)
			dish.portion2 = 0;
		else if (dish.portion3 == portionId)
			dish.portion3 = 0;
		else if (dish.portion4 == portionId)
			dish.portion4 = 0;
		else if (dish.portion5 == portionId)
			dish.portion5 = 0;
		else if (dish.portion6 == portionId)
			dish.portion6 = 0;
		else if (dish.portion7 == portionId)
			dish.portion7 = 0;
		else if (dish.portion8 == portionId)
			dish.portion8 = 0;
		else if (dish.portion9 == portionId)
			dish.portion9 = 0;
		addToPlate(dish);
		$('#edit-plate-dial').dialog('close');
	}
}

function hijaxPlatesPage() {
	if (!authenticated)	{
		// tjs 120120
		$.mobile.changePage("#prerequisite-dial");
		//alert("You must login before using this feature!");
		return;
	}
	//alert("plateSlateCellApp hijaxPlatesPage...");
	// tjs 120224
	var plateName;
	var plateNames = new Array();
	// tjs 120228
	/*
	var keys = new Array();
	for (var i = 0; i < plates.length; i++) {
	    if (i in plates) {
			var plate = plates[i];
			plateName = plate.name;
			plateNames[plateName] = i;
			keys.push(plateName);
	    }
	}
	//alert("plateSlateCellApp sorting portionNames...");
	//portionNames.sort(keyCmp);
	keys.sort();
*/
	var actives = new Array();
	var inActives = new Array();
	for (var i = 0; i < plates.length; i++) {
	    if (i in plates) {
			var plate = plates[i];
			plateName = plate.name;
			plateNames[plateName] = i;
			if (plate.isInactive > 0)
				inActives.push(plateName);
			else
				actives.push(plateName);
	    }
	}
	//alert("plateSlateCellApp sorting portionNames...");
	//keys.sort();
	actives.sort();
	inActives.sort();

	  // create page markup
	var newPageHtml = '<div data-role="page" id="plates-page" data-title="Plates" class="type-interior" data-theme="b" data-dom-cache="true">';
	newPageHtml += '<div data-role="header" data-theme="f" data-position="fixed">';
	newPageHtml += '<a href="index.html" data-icon="home" data-iconpos="notext" data-direction="reverse" class="ui-btn-left jqm-home">Home</a>';
	newPageHtml += '<h1>Plates</h1>';
	newPageHtml += '</div>';
	newPageHtml += '<div data-role="content">';
	newPageHtml += '<div class="content-primary">';
	//newPageHtml += '<ul data-role="listview" id="plates-list" data-filter="true" data-filter-placeholder="Search..." data-split-icon="delete" data-split-theme="d">';
	newPageHtml += '<ul data-role="listview" id="plates-list" data-filter="true" data-filter-placeholder="Search..." data-split-theme="d">';
	newPageHtml += '<li data-role="list-divider" data-theme="b"><a href="javascript:addPlate()">Add New Plate</a></li>';
	//newPageHtml += '<li data-role="list-divider" data-theme="b"><a href="javascript:addPortion()" data-icon="add">Add New Portion</a></li>';
	newPageHtml += '<li data-role="list-divider" data-theme="b">Plates Revealed for Selection:</li>';
	for(var j = 0; j < actives.length; j++) {
		plateName = actives[j];
		var i = plateNames[plateName];
		newPageHtml += '<li><a href="javascript:editPlate(' + i + ')">' + plateName + '</a><a href="javascript:togglePlateInactive(true, ' + i + ')" data-role="button" data-icon="delete">Conceal Plate</a></li>';
	}
	//newPageHtml += '<li data-role="list-divider" data-theme="b"><a href="javascript:addPortion()">Add New Portion</a></li>';
	newPageHtml += '<li data-role="list-divider" data-theme="b">Concealed Plates:</li>';
	for(var j = 0; j < inActives.length; j++) {
		plateName = inActives[j];
		var i = plateNames[plateName];
		newPageHtml += '<li><a href="javascript:editPlate(' + i + ')">' + plateName + '</a><a href="javascript:togglePlateInactive(false, ' + i + ')" data-role="button" data-icon="add">Reveal Plate</a></li>';
	}
	//alert("plateSlateCellApp hijaxPlatesPage plates.length " + plates.length);
	/*
	for(var j = 0; j < keys.length; j++) {
		plateName = keys[j];
		var i = plateNames[plateName];
		newPageHtml += '<li><a href="javascript:editPlate(' + i + ')">' + plateName + '</a><a href="javascript:inactivatePlate(' + i + ')" data-role="button">Remove Plate</a></li>';
	}
*/
	/*for (var i = 0; i < plates.length; i++) {
	    if (typeof(plates[i]) !== 'undefined') {

		var plate = plates[i];
		var plateName = plate.name;
		//if (i%5 == 0)
		//	alert("plateSlateCellApp hijaxPlatesPage plate name " + plateName);
		newPageHtml += '<li><a href="javascript:editPlate(' + i + ')">' + plateName + '</a><a href="javascript:inactivatePlate(' + i + ')" data-role="button">Remove Plate</a></li>';
	    }
	}*/
	newPageHtml += "</ul>";
	newPageHtml += '</div>'; // end content primary
	/*
	newPageHtml += '<div class="content-secondary">';
	newPageHtml += '<ul data-role="listview" id="add-plates-list" data-filter="false" data-split-icon="add" data-split-theme="d">';
	newPageHtml += '<li><a href="javascript:addPlate()">Add New Plate</a><a href="javascript:activatePlate()" data-role="button">Add Plate</a></li>';
	newPageHtml += "</ul>";
	newPageHtml += '</div>'; // end content secondary
	*/
	newPageHtml += '</div></div>';
	//alert("plateSlateCellApp hijaxPlatesPage newPageHtml " + newPageHtml);
	var newPage = $(newPageHtml);
	//add new dialog to page container
	newPage.appendTo($.mobile.pageContainer);
	// enhance and open the new dialog
    $.mobile.changePage(newPage);	
}

function addPlate() {
	//alert("plateSlateCellApp addPlate...");
	$.mobile.changePage("#add-plate-dial");
}

//function activatePlate() {
//	alert("plateSlateCellApp activatePlate...");
//}

function editPlate(index) {
	//alert("plateSlateCellApp editPlate index " + index);
	// tjs 120223
	//var indexOffset = 1000 + index;
	var plate = plates[index];
	var mealName = plate.type;
	//assigns values to globals such as grainPortionSelectListHtml
	// tjs 120227
	//derivePortionSelectionLists(false);
	var preSelectedPortions = new Array();
	
	// set empty lists...
	plateGrainsHtml = '<li/>';
	plateProteinHtml = '<li/>';
	plateVegetablesHtml = '<li/>';
	plateFruitsHtml = '<li/>';
	plateDairyHtml = '<li/>';
	
	// possibly appends tags to above empty lists...
	if (plate.portion1 != null) {
		appendPortion(plate, plate.portion1, index, false);
		preSelectedPortions.push(plate.portion1);
	}
	if (plate.portion2 != null) {
		appendPortion(plate, plate.portion2, index, false);
		preSelectedPortions.push(plate.portion2);
	}
	if (plate.portion3 != null) {
		appendPortion(plate, plate.portion3, index, false);
		preSelectedPortions.push(plate.portion3);
	}
	if (plate.portion4 != null) {
		appendPortion(plate, plate.portion4, index, false);
		preSelectedPortions.push(plate.portion4);
	}
	if (plate.portion5 != null) {
		appendPortion(plate, plate.portion5, index, false);
		preSelectedPortions.push(plate.portion5);
	}
	if (plate.portion6 != null) {
		appendPortion(plate, plate.portion6, index, false);
		preSelectedPortions.push(plate.portion6);
	}
	if (plate.portion7 != null) {
		appendPortion(plate, plate.portion7, index, false);
		preSelectedPortions.push(plate.portion7);
	}
	if (plate.portion8 != null) {
		appendPortion(plate, plate.portion8, index, false);
		preSelectedPortions.push(plate.portion8);
	}
	if (plate.portion9 != null) {
		appendPortion(plate, plate.portion9, index, false);
		preSelectedPortions.push(plate.portion9);
	}

	derivePortionSelectionLists(preSelectedPortions);

	var newDialHtml = '<div data-role="dialog" id="edit-plate-dial"><div data-role="header">';
	newDialHtml += '<h1>Edit Plate</h1></div>';	
	newDialHtml += '<div data-role="content" data-theme="c">';	
	newDialHtml += '<li data-role="list-divider" data-theme="b"><div data-type="horizontal">';
	// tjs 120223
	//newDialHtml += '<a href="javascript:hijaxGrainSelectionDial(' + indexOffset + ",'" + mealName + "'" + ');" data-role="button" data-icon="plus" data-inline="true" data-iconpos="right">Grains</a>';
	newDialHtml += '<a href="javascript:hijaxGrainSelectionDial(' + index + ",'" + mealName + "', false" + ');" data-role="button" data-icon="plus" data-inline="true" data-iconpos="right">Grains</a>';
	newDialHtml += '</div></li>';
	newDialHtml += plateGrainsHtml;
	newDialHtml += '<li data-role="list-divider" data-theme="b"><div data-type="horizontal">';
	newDialHtml += '<a href="javascript:hijaxProteinSelectionDial(' + index + ",'" + mealName + "', false" + ');" data-role="button" data-icon="plus" data-inline="true" data-iconpos="right">Protein</a>';
	newDialHtml += '</div></li>';
	newDialHtml += plateProteinHtml;
	newDialHtml += '<li data-role="list-divider" data-theme="b"><div data-type="horizontal">';
	newDialHtml += '<a href="javascript:hijaxVegetablesSelectionDial(' + index + ",'" + mealName + "', false" + ');" data-role="button" data-icon="plus" data-inline="true" data-iconpos="right">Vegetables</a>';
	newDialHtml += '</div></li>';
	newDialHtml += plateVegetablesHtml;
	newDialHtml += '<li data-role="list-divider" data-theme="b"><div data-type="horizontal">';
	newDialHtml += '<a href="javascript:hijaxFruitsSelectionDial(' + index + ",'" + mealName + "', false" + ');" data-role="button" data-icon="plus" data-inline="true" data-iconpos="right">Fruits</a>';
	newDialHtml += '</div></li>';
	newDialHtml += plateFruitsHtml;
	newDialHtml += '<li data-role="list-divider" data-theme="b"><div data-type="horizontal">';
	newDialHtml += '<a href="javascript:hijaxDairySelectionDial(' + index + ",'" + mealName + "', false" + ');" data-role="button" data-icon="plus" data-inline="true" data-iconpos="right">Dairy</a>';
	newDialHtml += '</div></li>';
	newDialHtml += plateDairyHtml;

	newDialHtml += '</div><script></script></div>';
	var newDial = $(newDialHtml);
	//add new dialog to page container
	newDial.appendTo($.mobile.pageContainer);
	
	// tweak the new dialog just added into the dom

	// enhance and open the new dialog
    $.mobile.changePage(newDial);
}

//tjs 120227
function togglePlateInactive(torf, index) {
	//alert("plateSlateCellApp togglePlateInactive torf " + torf + " index " + index);
	var plate = plates[index];
	if (torf) {
		plate.isInactive = 1;
	} else {
		plate.isInactive = 0;
	}
	addToPlate(plate);
}

//function inactivatePlate(index) {
//	alert("plateSlateCellApp inactivatePlate index " + index);
//}

function processAddPlateForm() {
	var plateName;
	var plateDescription;
	var typeSelection;
	plateName = document.addPlateForm.name.value;
	plateDescription = document.addPlateForm.description.value;
	typeSelection = document.addPlateForm.type;
	var optionValue = typeSelection.options[typeSelection.selectedIndex].value;
	//alert("plateSlateCellApp processAddPlateForm plateName " + plateName + " plateDescription " + plateDescription + " optionValue " + optionValue);
	
	var dish;
	var plateExists = false;
	var i = plates.length;
	// tjs 120223
	//for (var j = 1; j < i; j++) {
	for (var j = 0; j < i; j++) {
		if (j in plates) {
			dish = plates[j];
			if (dish.name == plateName) {
				plateExists = true;
				break;
			}
		}
	}
	if (!plateExists) {
		var index = i++;	
		dish = new Plate(index, optionValue, plateName, plateDescription, 0, null, null, null, null, null, null, null, null, null, 0);
		addToPlate(dish);
		plates[index] = dish;
		// use plate edit dialog...
		editPlate(index);
	} else {
		var msg = "The plate with name " + plateName + " already Exists!";
		alert(msg);
		$('#add-plate-dial').dialog('close');
	}
}

function hijaxPortionsPage() {
	// for debug comment out this...
	if (!authenticated)	{
		// tjs 120120
		$.mobile.changePage("#prerequisite-dial");
		//alert("You must login before using this feature!");
		return;
	}
	// tjs 120224
	var portionName;
	var portionNames = new Array();
	// tjs 120227
	//var keys = new Array();
	var actives = new Array();
	var inActives = new Array();
	for (var i = 0; i < portions.length; i++) {
	    if (i in portions) {
			var portion = portions[i];
			portionName = portion.name;
			portionNames[portionName] = i;
			if (portion.isInactive > 0)
				inActives.push(portionName);
			else
				actives.push(portionName);
	    }
	}
	//alert("plateSlateCellApp sorting portionNames...");
	//keys.sort();
	actives.sort();
	inActives.sort();
	
	  // create page markup
	var newPageHtml = '<div data-role="page" id="portions-page" data-title="Portions" class="type-interior" data-theme="b" data-dom-cache="true">';
	newPageHtml += '<div data-role="header" data-theme="f" data-position="fixed">';
	newPageHtml += '<a href="index.html" data-icon="home" data-iconpos="notext" data-direction="reverse" class="ui-btn-left jqm-home">Home</a>';
	newPageHtml += '<h1>Portions</h1>';
	newPageHtml += '</div>';
	newPageHtml += '<div data-role="content">';
	newPageHtml += '<div class="content-primary">';
	//newPageHtml += '<ul data-role="listview" id="portions-list" data-filter="true" data-filter-placeholder="Search..." data-split-icon="delete" data-split-theme="d">';
	newPageHtml += '<ul data-role="listview" id="portions-list" data-filter="true" data-filter-placeholder="Search..." data-split-theme="d">';
	//alert("plateSlateCellApp hijaxPortionsPage portions.length " + portions.length);
	newPageHtml += '<li data-role="list-divider" data-theme="b"><a href="javascript:addPortion()">Add New Portion</a></li>';
	//newPageHtml += '<li data-role="list-divider" data-theme="b"><a href="javascript:addPortion()" data-icon="add">Add New Portion</a></li>';
	newPageHtml += '<li data-role="list-divider" data-theme="b">Portions Revealed for Selection:</li>';
	for(var j = 0; j < actives.length; j++) {
		portionName = actives[j];
		var i = portionNames[portionName];
		newPageHtml += '<li><a href="javascript:editPortion(' + i + ')">' + portionName + '</a><a href="javascript:togglePortionInactive(true, ' + i + ')" data-role="button" data-icon="delete">Conceal Portion</a></li>';
	}
	//newPageHtml += '<li data-role="list-divider" data-theme="b"><a href="javascript:addPortion()">Add New Portion</a></li>';
	newPageHtml += '<li data-role="list-divider" data-theme="b">Concealed Portions:</li>';
	for(var j = 0; j < inActives.length; j++) {
		portionName = inActives[j];
		var i = portionNames[portionName];
		newPageHtml += '<li><a href="javascript:editPortion(' + i + ')">' + portionName + '</a><a href="javascript:togglePortionInactive(false, ' + i + ')" data-role="button" data-icon="add">Reveal Portion</a></li>';
	}
	newPageHtml += "</ul>";
	newPageHtml += '</div>'; // end content primary
	/*
	newPageHtml += '<div class="content-secondary">';
	newPageHtml += '<ul data-role="listview" id="add-portions-list" data-filter="false" data-split-icon="add" data-split-theme="d">';
	newPageHtml += '<li><a href="javascript:addPortion()">Add New Portion</a><a href="javascript:activatePortion()" data-role="button">Add Portion</a></li>';
	newPageHtml += "</ul>";
	newPageHtml += '</div>'; // end content secondary
	*/
	newPageHtml += '</div></div>';
	//alert("plateSlateCellApp hijaxPlatesPage newPageHtml " + newPageHtml);
	var newPage = $(newPageHtml);
	//add new dialog to page container
	newPage.appendTo($.mobile.pageContainer);
	// enhance and open the new dialog
    $.mobile.changePage(newPage);	
}

function addPortion() {
	//alert("plateSlateCellApp addPlate...");
	$.mobile.changePage("#add-portion-dial");
}

//function activatePortion() {
//	alert("plateSlateCellApp activatePortion...");
//}

function editPortion(index) {
	//alert("plateSlateCellApp editPortion index " + index);
	var portion = portions[index];
	var portionName = portion.name;
	var portionDescription = portion.description;
	var portionType = portion.type;
	var newDialHtml = '<div data-role="dialog" id="edit-portion-dial"><div data-role="header">';
	newDialHtml += '<h1>Edit Portion</h1></div>';	
	newDialHtml += '<div data-role="content" data-theme="c">';
	newDialHtml += '<form name="editPortionForm"><input type="hidden" name="index" value="'+ index + '"/>';
	newDialHtml += '<p>Edit Portion...</p>';
	newDialHtml += '<p/><p>	<label for="name">Portion Name:</label>';
	newDialHtml += '<input type="text" name="name" id="portionname" value="' + portionName + '" placeholder="portionname" data-theme="d"/></p>';
	newDialHtml += '<p><label for="description">Description:</label>';
	newDialHtml += '<input type="text" name="description" id="portiondescription" value="' + portionDescription + '" placeholder="description" data-theme="d"/></p>';
	newDialHtml += '<p><select name="type"><optgroup label="Type">';
	newDialHtml += '<option value ="Grain"';
	if (portionType == "Grain") {
		newDialHtml += 'selected="selected"';
	}
	newDialHtml += '>Grain</option>';
	newDialHtml += '<option value ="Protein"';
	if (portionType == "Protein") {
		newDialHtml += 'selected="selected"';
	}
	newDialHtml += '>Protein</option>';
	newDialHtml += '<option value ="Vegetables"';
	if (portionType == "Vegetables") {
		newDialHtml += 'selected="selected"';
	}
	newDialHtml += '>Vegetables</option>';
	newDialHtml += '<option value ="Fruits"';
	if (portionType == "Fruits") {
		newDialHtml += 'selected="selected"';
	}
	newDialHtml += '>Fruits</option>';
	newDialHtml += '<option value ="Dairy"';
	if (portionType == "Dairy") {
		newDialHtml += 'selected="selected"';
	}
	newDialHtml += '>Dairy</option>';
	newDialHtml += '</optgroup></select></p>';
	newDialHtml += '</form>';
	newDialHtml += '<br><br>';
	newDialHtml += '<a href="#home-page" data-role="button" data-inline="true" data-rel="back" data-theme="a">Cancel</a>';		
	newDialHtml += '<a href="javascript:processEditPortionForm();" data-role="button" data-inline="true">Save Portion Edit</a>';
	newDialHtml += '<div id ="resultLog"></div>';
	newDialHtml += '</div><script></script></div>';

	var newDial = $(newDialHtml);
	//add new dialog to page container
	newDial.appendTo($.mobile.pageContainer);
	
	// tweak the new dialog just added into the dom

	// enhance and open the new dialog
    $.mobile.changePage(newDial);
}

//function inactivatePortion(index) {
//	alert("plateSlateCellApp inactivatePortion index " + index);
//}

// tjs 120227
function togglePortionInactive(torf, index) {
	//alert("plateSlateCellApp togglePortionInactive torf " + torf + " index " + index);
	var portion = portions[index];
	if (torf) {
		portion.isInactive = 1;
	} else {
		portion.isInactive = 0;
	}
	addToPortion(portion);
}

function processAddPortionForm() {
	var portionName;
	var portionDescription;
	var typeSelection;
	portionName = document.addPortionForm.name.value;
	portionDescription = document.addPortionForm.description.value;
	typeSelection = document.addPortionForm.type;
	var optionValue = typeSelection.options[typeSelection.selectedIndex].value;
	//alert("plateSlateCellApp processAddPortionForm portionName " + portionName + " portionDescription " + portionDescription + " optionValue " + optionValue);
	
	var portion;
	var portionExists = false;
	var i = portions.length;
	// tjs 120223
	//for (var j = 1; j < i; j++) {
	for (var j = 0; j < i; j++) {
		if (j in portions) {
			portion = portions[j];
			if (portion.name == portionName) {
				portionExists = true;
				break;
			}
		}
	}
	if (!portionExists) {
		var index = i++;
		portion = new Portion(index, optionValue, portionName, portionDescription, 0, 0);
		portions[index] = portion;
		// use plate edit dialog...
		addToPortion(portion);
		$('#add-portion-dial').dialog('close');
	} else {
		var msg = "The portion with name " + portionName + " already Exists!";
		alert(msg);
		$('#add-portion-dial').dialog('close');
	}
}

function processEditPortionForm() {
	var portionName;
	var portionDescription;
	var typeSelection;
	var index = document.editPortionForm.index.value;
	portionName = document.editPortionForm.name.value;
	portionDescription = document.editPortionForm.description.value;
	typeSelection = document.editPortionForm.type;
	var optionValue = typeSelection.options[typeSelection.selectedIndex].value;
	//alert("plateSlateCellApp processEditPortionForm portionName " + portionName + " portionDescription " + portionDescription + " optionValue " + optionValue);
	
	var portion = portions[index];
	portion.name = portionName;
	portion.description = portionDescription;
	portion.type = optionValue;
	addToPortion(portion);
	$('#edit-portion-dial').dialog('close');
}

function makeColor(hue) {
    return "hsl(" + hue + ", 100%, 50%)";
}

function makeRandomScreenReportColor() {
	var selectedOption = Math.floor(Math.random()*(screenReportFontColors.length - 1));
	//return "hsl(" + selectedOption + ", 100%, 50%)";
	return makeColor(selectedOption);
}

function getScreenReportHues(len) {
	var screenReportHues = new Array(len);
	var selectedIndex = Math.floor(Math.random()*(screenReportFontColors.length - 1));
	var selectedOption = screenReportFontColors[selectedIndex];
	//alert("plateSlateCellApp getScreenReportHues selectedOption " + selectedOption);
	for (var i = 0; i < len; i++) {
		//screenReportHues.push(selectedOption);
		screenReportHues[i] = selectedOption;
		selectedOption += 40;
	}
	//alert("plateSlateCellApp getScreenReportHues screenReportHues: [0] " + screenReportHues[0] + " [1] "+ screenReportHues[1] + " [2] " + screenReportHues[2]);
	return screenReportHues;
}

// relative to "today" what is the description approprite for identification of the slate?
function getRelativeSlateDescription(slate) {
	//alert("plateSlateCellApp getRelativeSlateDescription...");
	var relativeSlateDescription = null;
	var dayMillies = 24*60*60*1000;
	//if (typeof(slate) != 'undefined') {
		var today = new Date();
		today.setHours(0, 0, 0, 0);
		var todayMillis = today.getTime();
		//alert("plateSlateCellApp getRelativeSlateDescription todayMillis " + todayMillis);
		var date = slate.date;
		//alert("plateSlateCellApp getRelativeSlateDescription date " + date);
        var relativeDateName = date.toLocaleString();
    	//alert("plateslate getSlateView priorOffset " + priorOffset + " slate name " + slate.name + " id " + slate.id + " priorDate name " + priorDateName);
        relativeDate = new Date(relativeDateName);
        var relativeDateMillis = relativeDate.getTime();
		//var dateMillis = date.getTime();
		//alert("plateSlateCellApp getRelativeSlateDescription todayMillis " + todayMillis + " dateMillis "+ dateMillis);
		//alert("plateSlateCellApp getRelativeSlateDescription today " + today + " date "+ date + " todayMillis " + todayMillis + " dateMillis "+ dateMillis);
		if (todayMillis == relativeDateMillis) {
			relativeSlateDescription = "Today";			
		} else if (relativeDateMillis - todayMillis == dayMillies) {
			relativeSlateDescription = "Tomorrow"; // one day into future
		} else if (todayMillis - relativeDateMillis == dayMillies) {
			relativeSlateDescription = "Yesterday"; // one day in past
		} else if (relativeDateMillis - todayMillis > 0) {
			relativeSlateDescription = slate.description; // a future day, use dow
		} else {
			relativeSlateDescription = slate.name; // a past date, use actual month, day, year
		}
	//}
		//alert("plateSlateCellApp getRelativeSlateDescription relativeSlateDescription " + relativeSlateDescription);
	return relativeSlateDescription;			
}

// tjs 120202
function doClientBackup() {
	if (!authenticated)	{
		alert("You must login before using this feature!");
		return;
	}
	//alert("plateSlateCellApp doClientBackup starting...");
	var thresholdOffset = slateOffsetThreshold;
	//var xml = getClientBackupXml('Client Backup', thresholdOffset);
	var xml = getClientBackupXml(thresholdOffset);
	//alert("plateSlateCellApp doClientBackup xml " + xml);
	// tjs 120206
	$.post("../plateslate/storeSlates.php", { xml: xml }, function(msg) {		
	//$.post("../plateslate/clientXml2RDBMS.php", { xml: xml }, function(msg) {		
		var len = msg.length;
		// need to chop off the %20 chars that were placed onto the msg in lieu of the new line    		
		var crop = len - 4;
		var path = new String(msg);
	//alert("plateslate click path " + path);
		path = path.substring(0, crop);
	//alert("plateslate click chop path " + path);
		//var url = '../plateslate/clintXml2RDBMS.php?xml=' + path;
		//var patt1=/slate.......xml/gi;
		//windowName = msg.match(patt1);
		//alert("plateslate click url " + url + " windowName " + windowName);
		//window.open(url, windowName, 'resizable,scrollbars');
		// tjs 120206
		$.get("../plateslate/clientXml2RDBMS.php", { xmlPath: path }, function(msg) {		
			//$.post("../plateslate/clientXml2RDBMS.php", { xml: xml }, function(msg) {		
				var len = msg.length;
				// tjs 120216
				$("#logout-dial").dialog("close");
				finishLogout();
		});
	});
}

/*
e.g. of data content (to be stored):
<tables memberId="xxxx">
<preferences>
	<preference type="" name="" isInactive="">
	(value)
	</preference>
	...
</preferences>
<portions>
	<portion type="" description="" isMaster="" isInactive="">
	(value i.e. the name)
	</portion>
</portions>
<plates>
	<plate name="" type="" description="" isMaster="" isInactive="">
		<portions>
			<portion type="">
			(value i.e. the name)
			</portion>
		</portions>
	</plate>
	...
</plates>
<slates>
	<slate name="August 27, 2011">
		<plate name="Flakes-n-Bakes" type="Breakfast" description="Cereal, Fruit, etc.">
			<portion type="Grain">Bran Flakes</portion>
			<portion type="Fruits">Grapes</portion>
			<portion type="Dairy">Milk</portion>
			<portion type="Grain">Muffins</portion>
		</plate>
		<plate name="PB Sandwich" type="Lunch" description="(with fruit)">
			<portion type="Grain">Irish Bread</portion>
			<portion type="Protein">Legeume Products</portion>
			<portion type="Fruits">Berries</portion>
			<portion type="Fruits">Apples</portion>
		</plate>
		<plate name="Ham Steak-w-RiceVeg" type="Dinner" description="">
			<portion type="Protein">Pork Products</portion>
			<portion type="Grain">Rice</portion>
			<portion type="Vegetables">Brussel Sprouts</portion>
		</plate>
	</slate>
	...
</slates>
</tables>
*/
//function getClientBackupXml(title, thresholdOffset) {
function getClientBackupXml(offset) {
	//alert("plateSlateCellApp getClientBackupXml offset " + offset);
	//alert("plateSlateCellApp getClientBackupXml offset " + offset + " accountId" + loginInfo.id);
	var xml = '<tables accountId="' + loginInfo.id + '" userName="' + loginInfo.userName + '" firstName="' + loginInfo.firstName + '" lastName="' + loginInfo.lastName + '">';
	// handle preferences...
	xml += '<preferences>';
	xml += '<preference type="user" name="share">';
	xml += plateSelectionShared;
	xml += '</preference>';
	xml += '</preferences>';
	//alert("plateSlateCellApp getClientBackupXml xml (preferences milestone) " + xml);

	// handle portions (i.e. morsels or segments on the USDA model plate)...
	xml += '<morsels>';
	xml += getMorselsXml();
	xml += '</morsels>';
	//alert("plateSlateCellApp getClientBackupXml xml (portions milestone) " + xml);

	// handle plates (more generally dishes)...
	xml += '<dishes>';
	xml += getDishesXml();
	xml += '</dishes>';
	//alert("plateSlateCellApp getClientBackupXml xml (plates milestone) " + xml);

	//use cache to create xml to be sent to server for the report.
	var cursor = offset;
	//var backwardsCursor = offset - 1;
	var slate;
	var count = 0;
	// just backup two weeks...
	var maxCount = 14;
	// TODO eliminate some attributes here:
	//xml += '<slates accountId="' + loginInfo.id + '" userName="' + loginInfo.userName + '" firstName="' + loginInfo.firstName + '" lastName="' + loginInfo.lastName + '" share="' + plateSelectionShared + '">';
	xml += '<slates>';
	while (count < maxCount) {
		//alert("plateslate getReportXml count " + count + " cursor " + cursor + " slate name " + slates[cursor].name);
		//alert("plateslate getReportXml forwards count " + count + " cursor " + cursor);
	    if (typeof(slates[cursor]) === 'undefined') {
	    	break;
	    } else {
	    	slate = slates[cursor++];
	    	count++;
	    	xml += getXml(slate);
			//alert("plateslate createReport next cursor " + cursor + " count " + count + " today onwards xml " + xml);
		}		
	}
	cursor = offset - 1;
	while (count < maxCount) {
		//alert("plateslate createReport count " + count + " cursor " + cursor + " slate name " + slates[cursor].name);
		//alert("plateslate createReport backwards count " + count + " cursor " + cursor);
	    if (typeof(slates[cursor]) === 'undefined') {
	    	break;
	    } else {
	    	slate = slates[cursor--];
	    	count++;
	    	xml += getXml(slate);
			//alert("plateslate createReport next cursor " + cursor + " count " + count + " today backwards xml " + xml);
		}		
	}
	
	xml += '</slates></tables>';
	//xml += '</tables>';
	return xml;	
}

function getMorselsXml() {
	//alert("plateslate getXml slate name " + slate.name + " id " + slate.id + " breakfast id " + slate.breakfastId);
	var xml = '';
	var portionsLen = portions.length;
	var portion;
	//alert("index getXml portionsLen " + portionsLen);
	for (var i = 0; i < portionsLen; i++) {
		//alert("plateslate getXml portion id " + portionId + " name " + portions[portionId].name + " type " + portions[portionId].type);
		//portion = portions[i];
		//xml += '<portion type="' + portion.type + '" description="' + portion.description + '" isMaster="' + portion.master + '" isInactive="' + portion.isInactive + '">' + portion.name + '</portion>';
		xml += getSegmentXml(i, true);
	}
	return xml;
}

function getSegmentXml(portionId, torf) {
	var xml;
	if (typeof(portions[portionId]) === 'undefined') {
		xml = '';
		/*
		if (torf)
			xml = '<morsel />';
		else
			xml = '<segment />';
		*/
    } else {
    	var portion = portions[portionId];
    	if (torf)
    		xml = '<morsel type="' + portion.type + '" description="' + portion.description + '" isMaster="' + portion.master + '" isInactive="' + portion.isInactive + '">' + portion.name + '</morsel>';
    	else
    		xml = '<segment type="' + portion.type + '" description="' + portion.description + '" isMaster="' + portion.master + '" isInactive="' + portion.isInactive + '">' + portion.name + '</segment>';
    }
	return xml;
}

function getDishesXml() {
	//alert("plateslate getXml slate name " + slate.name + " id " + slate.id + " breakfast id " + slate.breakfastId);
	var xml = '';
	var platesLen = plates.length;
	var plate;
	var portionId;
	//alert("index getXml portionsLen " + portionsLen);
	for (var i = 0; i < platesLen; i++) {
		//alert("plateslate getXml portion id " + portionId + " name " + portions[portionId].name + " type " + portions[portionId].type);
		if (typeof(plates[i]) === 'undefined') {
	    	continue;
	    } else {
			plate = plates[i];
			//xml += '<dish type="' + plate.type + '" name="' + plate.name + '" description="' + plate.description + '" isMaster="' + plate.master + '" isInactive="' + plate.isInactive + '">';
			xml += '<dish type="' + plate.type + '" name="' + plate.name + '" description="' + plate.description + '" isMaster="' + plate.master + '" isInactive="' + plate.isInactive + '"><segments>';
			portionId = plate.portion1;
			if (portionId != null)
				xml += getSegmentXml(portionId, false);
			portionId = plate.portion2;
			if (portionId != null)
				xml += getSegmentXml(portionId, false);
			portionId = plate.portion3;
			if (portionId != null)
				xml += getSegmentXml(portionId, false);
			portionId = plate.portion4;
			if (portionId != null)
				xml += getSegmentXml(portionId, false);
			portionId = plate.portion5;
			if (portionId != null)
				xml += getSegmentXml(portionId, false);
			portionId = plate.portion6;
			if (portionId != null)
				xml += getSegmentXml(portionId, false);
			portionId = plate.portion7;
			if (portionId != null)
				xml += getSegmentXml(portionId, false);
			portionId = plate.portion8;
			if (portionId != null)
				xml += getSegmentXml(portionId, false);
			portionId = plate.portion9;
			if (portionId != null)
				xml += getSegmentXml(portionId, false);
			//xml += '</dish>';
			xml += '</segments></dish>';
	    }
	}
	return xml;
}

// tjs 120221
//function doRestoreFromBackup(accountId) {
function doRestoreFromBackup(accountId, profile) {
    //alert("plateslate doRestoreFromBackup accountId " + accountId);
	var url;
	//var url = '../plateslate/getServerDataAsXML.php?account=' + accountId;
	if (profile != null) {
		url = '../plateslate/getServerDataAsXMLbyProfile.php?account=' + accountId + '&profile=' + profile;
		importProfile = true;
	} else {
		url = '../plateslate/getServerDataAsXML.php?account=' + accountId;
		importProfile = false;
	}
    $.ajax({  
        //type: "POST",  
      type: "GET",
      //url: "../plateslate/getServerDataAsXML.php",
      //data: { "account": accountId },  
      url: url,
     dataType: ($.browser.msie) ? "text" : "xml",
      success: function(data) {
          //alert("plateslate doRestoreFromBackup success...");
          var xml;
          if (typeof data == "string") {
            xml = new ActiveXObject("Microsoft.XMLDOM");
            xml.async = false;
            xml.loadXML(data);
          } else {
            xml = data;
          }

          // e.g. <preferences><preference type="user" name="share">true</preference></preferences>
			var preferences = new Array();
			//var sql;
			var preference;
			$(xml).find('preference').each(function() {
				var preference = $(this);
				var preferenceType = preference.attr('type');
				var preferenceName = preference.attr('name');
				var preferenceValue = preference.text();
		         //alert("plateslate doRestoreFromBackup preference type " + preferenceType + " preferenceName " + preferenceName + " preferenceValue " + preferenceValue);
			});

			// delete all rows from all tables...
			systemDB.transaction(
					function(transaction) {
						transaction.executeSql(
						'DELETE from food', null,						
						function (transaction, result) {
							//alert("plateslate loadPlates result.rows.length " + result.rows.length);
						});
					});
			systemDB.transaction(
					function(transaction) {
						transaction.executeSql(
						'DELETE from slate', null,						
						function (transaction, result) {
							//alert("plateslate loadPlates result.rows.length " + result.rows.length);
						});
					});
			systemDB.transaction(
					function(transaction) {
						transaction.executeSql(
						'DELETE from plate', null,						
						function (transaction, result) {
							//alert("plateslate loadPlates result.rows.length " + result.rows.length);
						});
					});
			systemDB.transaction(
					function(transaction) {
						transaction.executeSql(
						'DELETE from portion', null,						
						function (transaction, result) {
							//alert("plateslate loadPlates result.rows.length " + result.rows.length);
						});
					});

			// the cache arrays also need to be truncated...
			slates.length = 0;
			plates.length = 0;
			portions.length = 0;
			
			// now repopulate the portions
			var type;
			var description;
			var isMaster;
			var isInactive;
			var name;
			// e.g. <morsel type="Fruits" description="mango" isMaster="0" isInactive="0">mango</morsel>
			//var morsels = new Array();
			var morsel;
			var index = 0;
			$(xml).find('morsel').each(function() {
				var morsel = $(this);
				type = morsel.attr('type');
				description = morsel.attr('description');
				isMaster = morsel.attr('isMaster');
				isInactive = morsel.attr('isInactive');
				name = morsel.text();
				var portion = new Portion(index++, type, name, description, isMaster, isInactive);
				//morsels.push(portion);
				portions.push(portion);
		         //alert("plateslate doRestoreFromBackup preference type " + preferenceType + " preferenceName " + preferenceName + " preferenceValue " + preferenceValue);
			});
	         //alert("plateslate doRestoreFromBackup morsels length " + morsels.length);
	         //alert("plateslate doRestoreFromBackup portions length " + portions.length);
	         // tjs 120211
	         //insertPortionMasterData(false);
	         //insertPortionMasterData(false, xml);
			// tjs 120216
			//portionNames.length = 0;
	         insertPortionMasterData(false, xml);
	         // here we have the database loaded with portions and the array cache is properly synchronized
	         //alert("plateslate doRestoreFromBackup portions synchronized length " + portions.length);
      },
      error: function(xmlReq, status, errorMsg) {
	         alert("plateslate doRestoreFromBackup status " + status + " errorMsg " + errorMsg);
	         // e.g. msg = plateslate doRestoreFromBackup msg parsererror
      }
    });  
    return false;	
}