/*
 * License information at https://github.com/Caltech-IPAC/firefly/blob/master/License.txt
 */
import {once, isTypedArray, isArray} from 'lodash';
import {createCanvas, memorizeLastCall} from '../../../util/WebUtil.js';
import {Band} from 'firefly/visualize/Band.js';



const getColorTableMap= once( () => {
	const clt0=  Uint8Array.of(
		0,   0,   0,   0,
		255, 255, 255, 255
	);

	const clt1=  Uint8Array.of(
		255,   0,   0,   0,
		0, 255, 255, 255
	);

	const clt2=  Uint8Array.of(
		0, 0, 0, 0,
		17, 98, 0, 180,
		34, 180, 0, 98,
		51, 255, 0, 0,
		68, 246, 88, 0,
		85, 220, 181, 0,
		102, 181, 220, 0,
		119, 88, 245, 0,
		136, 0, 255, 0,
		153, 0, 235, 98,
		170, 0, 180, 180,
		187, 0, 98, 235,
		204, 0, 0, 255,
		221, 85, 128, 255,
		238, 170, 192, 255,
		255, 255, 255, 255,
	);

	const clt3=  Uint8Array.of(
		0,   0,   0,   0,
		25,   0,   0, 150,
		40,   0,   0, 255,
		55,   0, 125, 225,
		70,   0, 196, 196,
		90,   0, 226, 125,
		110,   0, 255,   0,
		130, 150, 255,   0,
		150, 225, 225,   0,
		175, 255, 150,   0,
		200, 255,   0,   0,
		225, 196,   0, 196,
		255, 255, 255, 255,
	);

	const clt4=  Uint8Array.of(
		0, 0, 0, 0,
		17, 0, 0, 95,
		34, 0, 20, 175,
		51, 0, 63, 250,
		68, 0, 112, 255,
		85, 0, 162, 175,
		102, 0, 210, 90,
		119, 20, 255, 30,
		136, 135, 240, 0,
		153, 210, 205, 0,
		170, 240, 135, 0,
		187, 255, 20, 0,
		204, 240, 0, 0,
		221, 255, 85, 85,
		238, 255, 170, 170,
		255, 255, 255, 255,
	);

	const clt5=  Uint8Array.of(
		0,   255, 255, 255,
		17,  255, 170, 170,
		34,  255,  85,  85,
		51,  240,   0,   0,
		68,  255,  20,   0,
		85,  240, 135,   0,
		102, 210, 205,   0,
		119, 135, 240,   0,
		136,  20, 255,  30,
		153,   0, 210,  90,
		170,   0, 162, 175,
		187,   0, 112, 255,
		204,   0,  63, 250,
		221,   0,  20, 175,
		238,   0,   0,  95,
		255,   0,   0,   0,
	);

	const clt6=  Uint8Array.of(
		0, 0, 0, 0,
		17, 0, 0, 47,
		34, 0, 0, 95,
		51, 0, 10, 140,
		68, 0, 20, 175,
		85, 0, 41, 212,
		102, 0, 63, 250,
		119, 0, 83, 252,
		136, 0, 112, 255,
		153, 0, 137, 212,
		170, 0, 162, 175,
		187, 20, 255, 30,
		204, 210, 205, 0,
		221, 240, 135, 0,
		238, 240, 0, 0,
		255, 255, 255, 255,
	);


	const clt7= Uint8Array.of(
		0, 255, 0, 0,
		17, 255, 32, 32,
		34, 255, 64, 64,
		51, 255, 96, 96,
		68, 255, 128, 128,
		85, 255, 160, 160,
		102, 255, 192, 192,
		119, 255, 224, 224,
		136, 224, 224, 255,
		153, 192, 192, 255,
		170, 160, 160, 255,
		187, 128, 128, 255,
		204, 96, 96, 255,
		221, 64, 64, 255,
		238, 32, 32, 255,
		255, 0, 0, 255,
	);
	const clt8= Uint8Array.of(
		0,  0,  0,  0,
		32, 0,  128, 0,
		64, 0,  255,85,
		128,255,0,  255,
		164, 255, 0,   128,
		197, 255, 0,   0,
		255, 255, 255, 0,
	);
	const clt9= Uint8Array.of(
		0,  0,  0,  0,
		64, 0,  0,  255,
		128, 255, 0,   0,
		192, 255, 255, 0,
		255, 255, 255, 255,
	);
	const clt10= Uint8Array.of(
		0,  0,  0,  0,
		64, 128, 0,   0,
		128,  255, 128, 0,
		192, 255, 255, 128,
		255, 255, 255, 255,
	);
	const clt11= Uint8Array.of(
		0,  0,  0,  0,
		4,  128,0,  32,
		8,  128,0,  96,
		17, 128,0,  160,
		32, 128,128,96,
		64, 128,192,64,
		128,192,207,128,
		255,255,255,255,
	);
	const clt12= Uint8Array.of(
		0, 0, 0, 0,
		32, 0, 0, 0,
		33, 0, 255, 0,
		64, 0, 255, 0,
		65, 0, 0, 255,
		96, 0, 0, 255,
		97,0, 255, 255,
		128, 0, 255, 255,
		129, 255, 0, 0,
		160, 255, 0, 0,
		161, 255, 255, 0,
		192, 255, 255, 0,
		193, 255, 0, 255,
		224, 255, 0, 255,
		225, 255, 255, 255,
		255, 255, 255, 255,
	);
	const clt13= Uint8Array.of(
		0, 50, 50, 50,
		28, 50, 50, 50,
		29, 122, 0, 155,
		57,122, 0, 155,
		58, 0, 0, 201,
		85, 0, 0, 201,
		86,  95, 168, 237,
		114, 95, 168, 237,
		115, 0, 153, 0,
		142, 0, 153, 0,
		143, 0, 247,0,
		171, 0, 247,0,
		172, 255, 255, 0,
		199, 255, 255, 0,
		200, 255, 178, 0,
		228, 255, 178, 0,
		229, 255, 0, 0,
		255, 255, 0, 0,
	);
	const clt14= Uint8Array.of(
		0,    0,    0,    0,
		1,   11,    0,   13,
		2,   22,    0,   27,
		3,   33,    0,   40,
		5,   44,    0,   54,
		6,   55,    0,   67,
		7,  66,    0,   81,
		8,   78,    0,   94,
		10,   89,    0,  108,
		11,  100,    0,  121,
		12,  111,    0,  135,
		14,  122,    0,  148,
		15,  133,    0,  162,
		16,  129,    0,  163,
		17, 126,    0,  165,
		19,  122,    0,  166,
		20,  118,    0,  168,
		21,  114,    0,  169,
		22,  111,    0,  170,
		24,  107,   0,  172,
		25,  103,    0,  173,
		26,  100,    0,  175,
		28,   96,    0,  176,
		29,   92,    0,  178,
		30,   88,    0,  179,
		31,   81,    0,  182,
		33,   74,    0,  184,
		34,   66,    0,  187,
		35,   59,    0,  189,
		36,   52,    0,  192,
		38,   44,    0,  195,
		39,   37,   0,  197,
		40,   29,    0,  200,
		42,   22,    0,  202,
		43,   15,    0,  205,
		44,    7,   0,  208,
		45,    0,    0,  210,
		47,   0,    5,  214,
		48,    0,   10,  218,
		49,    0,   15,  221,
		51,    0,   20,  225,
		52,    0,   25,  229,
		53,    0,   30,  233,
		54,    0,   35,  236,
		56,    0,   40,  240,
		57,   0,   45,  244,
		58,    0,   51,  248,
		59,    0,   56,  251,
		61,    0,   61,  255,
		62,    0,   68,  255,
		63,    0,   76,  255,
		65,    0,   84,  255,
		66,    0,   92,  255,
		67,   0,  100,  255,
		68,    0,  108,  255,
		70,    0,  115,  255,
		71,    0,  123,  255,
		72,    0,  131,  255,
		73,    0,  139,  255,
		75,    0,  147, 255,
		76,    0,  155,  255,
		77,   0,  161,  249,
		79,    0,  168,  242,
		80,    0,  174,  236,
		81,    0,  180,  230,
		82,    0,  187, 224,
		84,    0,  193,  217,
		85,    0,  200,  211,
		86,    0,  206,  205,
		87,   0,  212,  198,
		89,    0,  219,  192,
		90,    0,  225,  186,
		91,    0,  232,  179,
		93,    0,  230,  173,
		94,    0,  228,  166,
		95,    0,  227, 159,
		96,    0,  225,  152,
		98,    0,  224,  145,
		99,    0,  222,  138,
		100,    0,  220,  131,
		102,    0,  219,  124,
		103,    0,  217, 118,
		104,    0,  216,  111,
		105,    0,  214,  104,
		107,   0,  212,   97,
		108,    0,  212,   90,
		109,    0,  212,   84,
		110,    0,  212,   77,
		112,    0,  212,   71,
		113,    0,  212,   64,
		114,    0,  212,   58,
		116,    0,  212,   51,
		117,   0,  212,   45,
		118,    0,  211,   38,
		119,    0,  211,   32,
		121,    0,  211,   25,
		122,    0,  211,   19,
		123,    8,  213,   17,
		124,   17, 214,   15,
		126,   25,  216,   14,
		127,  34,  217,  12,
		128,   42,  219,   11,
		130,   51,  221,    9,
		131,   59,  222,    8,
		132,   68,  224,    6,
		133,   76,  225,    5,
		135,   85,  227,   3,
		136,   93,  228,    2,
		137, 101,  230,    0,
		138,  110,  230,    0,
		140,  118,  230,    0,
		141,  127, 230,    0,
		142,  135,  230,    0,
		144,  144,  230,    0,
		145,  152,  230,    0,
		146,  160,  230,    0,
		147, 169,  230,    0,
		149,  177, 230,    0,
		150,  186,  230,    0,
		151,  194,  230,    0,
		153,  202,  230,    0,
		154,  207, 229,    1,
		155,  211,  228,    2,
		156,  215,  226,    3,
		158,  220,  225,    4,
		159,  224,  224,    5,
		160,  229,  223,    6,
		161,  233,  221,    7,
		163,  237, 220,    8,
		164,  242,  219,    9,
		165,  246,  218,   10,
		167, 251,  216,   11,
		168,  255,  215,   12,
		169,  254,  210,   13,
		170,  253,  206,   14,
		172,  252,  201,   15,
		173,  251,  196,   16,
		174,  250,  191,   17,
		175,  248,  186,   18,
		177, 247, 182,   19,
		178,  246,  177,  20,
		179,  245,  172,   21,
		181,  244,  167,  22,
		182,  243,  163,   23,
		183,  242,  158,   24,
		184,  243,  153,   22,
		186,  244,  148,   20,
		187, 245,  144,   18,
		188,  246,  139,   16,
		189,  247, 134,   14,
		191,  248,  129,   12,
		192,  250,  125,   10,
		193,  251,  120,    8,
		195,  252,  115,    6,
		196,  253,  110,    4,
		197, 254,  105,    2,
		198,  255,  101,    0,
		200,  255,   92,    0,
		201,  254,   84,    0,
		202,  254,   76,    0,
		204,  253,   67,   0,
		205,  253,   59,    0,
		206,  252,   50,    0,
		207, 252,   42,    0,
		209,  252,   34,    0,
		210,  251,   25,    0,
		211,  251,   17,   0,
		212,  250,    8,    0,
		214,  250,    0,    0,
		215,  244,    0,    0,
		216,  238,    0,    0,
		218,  231,    0,    0,
		219,  225,    0,    0,
		220,  219,    0,    0,
		221,  213,    0,    0,
		223,  207,   0,    0,
		224,  201,    0,    0,
		225,  194,    0,    0,
		226,  188,    0,    0,
		228,  182,    0,    0,
		229,  176,    0,    0,
		230,  183,   21,   21,
		232,  189,   43,   43,
		233,  196,   64,   64,
		234,  202,   85,   85,
		235,  209,  106,  106,
		237, 215,  128,  128,
		238,  222,  149,  149,
		239,  229,  170,  170,
		240,  235,  191,  191,
		242,  242,  212,  212,
		243,  248,  234,  234,
		244,  255,  255,  255,
		246,  255,  255,  255,
		247, 255,  255,  255,
		248,  255,  255,  255,
		249,  255,  255,  255,
		251,  255,  255,  255,
		252,  255,  255,  255,
		253,  255,  255,  255,
		255,  255,  255,  255,
	);
	const clt15= Uint8Array.of(
		0,    0,    0,    0,
		1,   43,   43,   44,
		2,   54,   53,   55,
		3,   61,   60,   63,
		5,   67,  65,   69,
		6,   71,   69,   75,
		7,  74,   72,   79,
		8,   77,  74,   84,
		10,   79,   76,   87,
		11,   81,   78,   91,
		12,   82,   79,   94,
		14,   83,   80,   97,
		15,   84,   81,  100,
		16,   84,   82,  103,
		17,  84,   82,  105,
		19,   84,   82,  108,
		20,   83,   83,  110,
		21,   83,   83,  112,
		22,   82,   84,  114,
		24,   82,   85,  117,
		25,   82,   86,  119,
		26,   81,   87, 121,
		28,   81,   88,  122,
		29,   80,   89,  124,
		30,   79,   90,  126,
		31,   79,   91,  128,
		33,   78,   92,  129,
		34,   77,  94,  131,
		35,   76,   95,  133,
		36,   75,   97, 134,
		38,   74,   99,  136,
		39,   73,  101,  137,
		40,   72,  103,  139,
		42,   70,  105,  140,
		43,   69,  107, 141,
		44,   68,  110,  143,
		45,   67, 112,  144,
		47,  65,  115,  146,
		48,   64,  117, 147,
		49,   63,  120,  148,
		51,   61,  123,  149,
		52,   60,  127, 151,
		53,   58,  130,  152,
		54,   57, 133,  153,
		56,   55,  137, 154,
		57,  54,  141,  155,
		58,   53,  145,  156,
		59,   51,  149,  158,
		61,   50,  153,  159,
		62,   48,  157, 160,
		63,   47, 161,  160,
		65,   45,  162,  158,
		66,   44,  163,  155,
		67,  42,  164,  152,
		68,   41,  165,  149,
		70,   39,  166,  146,
		71,   38,  167, 143,
		72,   36,  168,  139,
		73,   35,  169,  136,
		75,   34,  170,  132,
		76,   32,  171,  128,
		77,  31,  172,  124,
		79,   29,  173,  120,
		80,   28,  174,  116,
		81,   27, 175,  111,
		82,   25,  176,  107,
		84,   24,  177, 102,
		85,   23,  177,  97,
		86,   22,  178,   92,
		87,  20,  179,   87,
		89,   19,  180,   82,
		90,   18,  181,   77,
		91,   17, 182,   71,
		93,   16,  183,   66,
		94,   15,  183,   60,
		95,   14,  184,   54,
		96,   13,  185,   49,
		98,   12,  186,   43,
		99,   11,  187,  37,
		100,   10,  187,  31,
		102,    9,  188,   25,
		103,    8,  189,   18,
		104,    7, 190,   12,
		105,    7, 191,    6,
		107,  12,  191,    6,
		108,   17, 192,    5,
		109,   22,  193,    4,
		110,   27, 194,    4,
		112,   32,  194,    3,
		113,   38,  195,    3,
		114,   44,  196,    2,
		116,   49,  196,    2,
		117,  55,  197,   1,
		118,   61,  198,    1,
		119,   67, 199,    1,
		121,   73,  199,    1,
		122,   79,  200,    0,
		123,   85,  201,    0,
		124,   92,  201,    0,
		126,   98,  202,    0,
		127, 104,  203,    0,
		128,  111,  203,    0,
		130,  117, 204,    0,
		131,  124,  205,    0,
		132,  131,  205,    1,
		133,  137, 206,    1,
		135,  144,  207,   1,
		136,  151,  207,   1,
		137, 158,  208,    2,
		138,  165,  209,    2,
		140,  171,  209,    3,
		141,  178,  210,    3,
		142,  185,  211,    4,
		144,  192,  211,    5,
		145,  199,  212,    6,
		146,  206,  212,    6,
		147, 212,  213,    7,
		149,  214,  208,    8,
		150,  214,  202,    9,
		151,  215,  197,  10,
		153,  215,  191,   11,
		154,  216,  186,   12,
		155,  217, 180,   14,
		156,  217, 175,   15,
		158,  218,  170,   16,
		159,  218,  164,   17,
		160,  219,  159,   19,
		161,  220,  154,   20,
		163,  220,  149,   22,
		164,  221,  144,   24,
		165,  221,  139,   25,
		167, 222,  134,   27,
		168,  222,  129,   29,
		169,  223,  125,   30,
		170,  224,  120,   32,
		172,  224,  116,   34,
		173,  225,  112,   36,
		174,  225,  107,  38,
		175,  226,  103,   40,
		177, 226,   99,   43,
		178,  227,  96,   45,
		179,  227,  92,   47,
		181,  228,   88,   49,
		182,  228,   85,   52,
		183,  229,   82,   54,
		184,  229,   79,   57,
		186,  230,   76,   59,
		187, 231,   73,   62,
		188,  231,   71,   64,
		189,  232,   68,   67,
		191,  232,   70,   74,
		192,  233,   73,   81,
		193,  233,   76,   89,
		195,  234,   78,   96,
		196,  234,   81,  103,
		197, 235,   84,  110,
		198,  235,   87, 118,
		200,  236,   91,  124,
		201,  236,   94,  131,
		202,  237,  97, 138,
		204,  237, 100,  145,
		205,  238,  103,  151,
		206,  238,  107, 157,
		207, 239,  110,  163,
		209,  239,  114,  169,
		210,  240,  117, 175,
		211,  240,  121,  181,
		212,  241,  124,  186,
		214,  241,  128,  192,
		215,  241,  131,  197,
		216,  242,  135,  202,
		218,  242,  139,  207,
		219,  243,  142,  211,
		220,  243,  146,  216,
		221,  244,  150,  220,
		223,  244,  154,  224,
		224,  245,  158,  228,
		225,  245,  162,  232,
		226,  246,  166,  235,
		228,  246,  170,  238,
		229,  247, 174,  241,
		230,  247, 178,  244,
		232,  248,  182,  247,
		233,  247, 186,  248,
		234,  246,  190,  248,
		235,  245,  194,  249,
		237, 244,  199,  249,
		238,  243,  203,  250,
		239,  243,  207, 250,
		240,  243,  211,  251,
		242,  243,  216,  251,
		243,  243,  220,  252,
		244,  244,  224,  252,
		246,  245,  229,  252,
		247, 246,  233,  253,
		248,  247, 237, 253,
		249,  249,  242,  254,
		251,  251,  246,  254,
		252,  253,  251,  255,
		253,  255,  255,  255,
		255,  255,  255,  255,
	);
	const clt16= Uint8Array.of(
		0,   0,   0,   0,
		87, 255, 87,0,
		166, 255, 166, 0,
		250, 255, 250, 255,
		255, 255, 255, 255,
	);
	const clt17= Uint8Array.of(
		0,   0,   0,   0,
		56,  0,   0,   106,
		74,  0,   24,  140,
		135, 13,  107,255,
		194, 25,  186, 255,
		245, 245, 255, 255,
		255, 255, 255, 255,
	);
	const clt18= Uint8Array.of(
		0,   255, 0,   255,
		51,  0,   0,   255,
		102, 0,   255, 255,
		153, 0,   255, 0,
		204, 255, 255, 0,
		255, 255, 0,   0,
	);
	const clt19= Uint8Array.of(
		0, 0, 0, 0,
		85, 85, 85, 255,
		86, 0, 85, 0,
		170, 85, 255, 85,
		171, 85, 0, 0,
		255, 255, 85, 85,
	);
	const clt20= Uint8Array.of(
		0,   0,   0,   0,
		16,  0,   0,   0,
		17, 15,  15,  51,
		33,  15,  15,  51,
		34,  30,  30,  102,
		50,  30,  30,  102,
		51,  45,  45,  153,
		67, 45,  45,  153,
		68,  76,  76,  255,
		84,  76,  76,  255,
		85,  0,   0,   0,
		101, 0,   0,   0,
		102, 15,  51,  15,
		118, 15,  51,  15,
		119, 30,  102, 30,
		135, 30,  102, 30,
		136, 45,  153, 45,
		152, 45,  153, 45,
		153, 76,  255, 76,
		169, 76,  255, 76,
		170, 0,   0,   0,
		186, 0,   0,   0,
		187,51,  15,  15,
		203, 51,  15,  15,
		204, 102, 30,  30,
		220, 102, 30,  30,
		221, 153, 45,  45,
		237,153, 45,  45,
		238, 255, 76,  76,
		255, 255, 76,  76,
	);
	const clt21= Uint8Array.of(
		0,   0,   0,   0,
		15,  0,   0,   0,
		16,  47, 47, 47,
		31,  47, 47, 47,
		32,  95,  95,  95,
		47, 95,  95,  95,
		48,  143, 143, 143,
		63,  143, 143, 143,
		64,  192, 192, 192,
		79,  192, 192, 192,
		80,  240, 240, 240,
		95,  240, 240, 240,
		96,  0,   47, 240,
		111, 0,   47, 240,
		112, 0,   95,  192,
		127,0,   95,  192,
		128, 0,   127,127,
		143, 0,   127,127,
		144, 0,   192, 79,
		159, 0,   192, 79,
		160, 0,   240, 0,
		175, 0,   240, 0,
		176, 79,  159, 0,
		191, 79,  159, 0,
		192, 127,127,0,
		207,127,127,0,
		208, 159, 79,  0,
		223, 159, 79,  0,
		224, 240, 0,   0,
		239, 240, 0,   0,
		240, 192, 0,   79,
		255, 192, 0,   79,
	);

	return {
		'0': clt0, 'grayscale': clt0,
		'1': clt1, 'reverseGrayscale': clt1,
		'2': clt2, 'colorCube': clt2,
		'3': clt3, 'spectrum': clt3,
		'4': clt4, 'falseColor': clt4,
		'5': clt5, 'falseColorReversed': clt5,
		'6': clt6, 'falseColorCompressed': clt6,
		'7': clt7, 'differenceImages': clt7,
		'8': clt8, 'ds9A': clt8,
		'9': clt9, 'ds9B': clt9,
		'10': clt10, 'ds9BB': clt10,
		'11': clt11, 'ds9HE': clt11,
		'12': clt12, 'ds9I8': clt12,
		'13': clt13, 'ds9AIPS': clt13,
		'14': clt14, 'ds9SLS': clt14,
		'15': clt15, 'ds9HSV': clt15,
		'16': clt16, 'ds9Heat': clt16,
		'17': clt17, 'ds9Cool': clt17,
		'18': clt18, 'ds9Rainbox': clt18,
		'19': clt19, 'ds9Standard': clt19,
		'20': clt20, 'ds9Staircase': clt20,
		'21': clt21, 'ds9Color': clt21,
	};
});

let defaultColorModel;

export function setDefaultColorModel(newDefaultColorModel) {
	defaultColorModel = newDefaultColorModel;
}


export function getCurrentColorModel() {
	if (!defaultColorModel) defaultColorModel = getColorModel(0);
	return defaultColorModel;
}


// export const getColorModel= memorizeLastCall((colorTableId) => {
// 	let old_dn, old_red, old_green, old_blue;
// 	let offset;
// 	let k;
//
// 	//palette: 3 bytes per color * 256 colors = 768 bytes in length
// 	const paletteData = new Uint8Array(768);
// 	const id= String(colorTableId);
// 	const ct= getColorTableMap()[id];
//
// 	if (id==='file') console.log('file color tables not yet supported');
//
// 	if (!ct) {
// 		console.log('ColorTable ERROR: no color table with the ID = ' + id);
// 		return [];
// 	}
//
// 	k = 0;
// 	let dn      = ct[k];
// 	let red     = ct[k+1];
// 	let green   = ct[k+2];
// 	let blue    = ct[k+3];
// 	k+=4;
//
// 	while(true) {
// 		old_dn = dn;
// 		old_red = red;
// 		old_green = green;
// 		old_blue = blue;
//
// 		if (k>=ct.length) break;
// 		dn      = ct[k];
// 		red     = ct[k+1];
// 		green   = ct[k+2];
// 		blue    = ct[k+3];
// 		k+=4;
//
// 		const inc= (dn > old_dn) ? 1 : -1;
//
// 		for(let kk = old_dn; kk !== dn; kk += inc) {
// 			if(kk>=0 && kk<=255) {
// 				offset =  (kk-old_dn) / (dn-old_dn);
// 				paletteData[3*kk] = (old_red   + Math.trunc(offset*(red   - old_red  )));
// 				paletteData[3*kk+1] = (old_green + Math.trunc(offset*(green - old_green)));
// 				paletteData[3*kk+2] = (old_blue  + Math.trunc(offset*(blue  - old_blue )));
// 			}
// 		}
// 	}
//
// 	if(old_dn>=0 && old_dn<=255)
// 	{
// 		paletteData[3*old_dn] =  old_red;
// 		paletteData[3*old_dn+1] =  old_green;
// 		paletteData[3*old_dn+2] =  old_blue;
// 	}
// 	/* DEBUG set top color = red */
// 	paletteData[3*255] = 255;
// 	paletteData[3*255 + 1] = 0;
// 	paletteData[3*255 + 2] = 0;
// 	/* END DEBUG */
// 	return paletteData;
// });

export const getColorModel= memorizeLastCall((colorTableId) => {
	let old_dn, old_red, old_green, old_blue;
	let offset;
	let k;

	//palette: 3 bytes per color * 256 colors = 768 bytes in length
	const paletteData = new Float32Array(768);
	const id= String(colorTableId);
	const ct= getColorTableMap()[id];

	if (id==='file') console.log('file color tables not yet supported');

	if (!ct) {
		console.log('ColorTable ERROR: no color table with the ID = ' + id);
		return [];
	}

	k = 0;
	let dn      = ct[k];
	let red     = ct[k+1];
	let green   = ct[k+2];
	let blue    = ct[k+3];
	k+=4;

	while(true) {
		old_dn = dn;
		old_red = red;
		old_green = green;
		old_blue = blue;

		if (k>=ct.length) break;
		dn      = ct[k];
		red     = ct[k+1];
		green   = ct[k+2];
		blue    = ct[k+3];
		k+=4;

		const inc= (dn > old_dn) ? 1 : -1;

		for(let kk = old_dn; kk !== dn; kk += inc) {
			if(kk>=0 && kk<=255) {
				offset =  (kk-old_dn) / (dn-old_dn);
				paletteData[3*kk] = (old_red   + Math.trunc(offset*(red   - old_red  )))/255;
				paletteData[3*kk+1] = (old_green + Math.trunc(offset*(green - old_green)))/255;
				paletteData[3*kk+2] = (old_blue  + Math.trunc(offset*(blue  - old_blue )))/255;
			}
		}
	}

	if(old_dn>=0 && old_dn<=255)
	{
		paletteData[3*old_dn] =  old_red/255;
		paletteData[3*old_dn+1] =  old_green/255;
		paletteData[3*old_dn+2] =  old_blue/255;
	}
	/* DEBUG set top color = red */
	paletteData[3*255] = 255/255;
	paletteData[3*255 + 1] = 0;
	paletteData[3*255 + 2] = 0;
	/* END DEBUG */
	return paletteData;
});

const makeRGBKey= (r,g,b) =>`${r}-${g}-${b}`;

/**
 *
 * @param {string|number} fromId
 * @param {string|number} toId
 * @return {function(number=, number=, number=): {r: number, b: number, g: number}}
 */
export function makeColorModelConverter(fromId, toId) {
    const fromCM= getColorModel(fromId);
	const toCM= getColorModel(toId);
	const convertObj= {};
	let key;
	for(let i=0, j=0; i<fromCM.length-3; i+=3, j++) {
		key= makeRGBKey(fromCM[i],fromCM[i+1],fromCM[i+2]);
		convertObj[key]= j;
	}
	return (r,g,b) => {
		const idx= convertObj[makeRGBKey(r,g,b)] ?? 0;
		const toIdx= idx*3;
		return {r: toCM[toIdx], g:toCM[toIdx+1], b:toCM[toIdx+2]};
	};
}

const toRGBAString= (r,g,b,a) => `rgba(${r}, ${g}, ${b}, ${a})`;

function drawLine(ctx,color, lineWidth, sx, sy, ex, ey) {
	ctx.save();
	ctx.lineWidth=lineWidth;
	ctx.strokeStyle=color;
	ctx.beginPath();
	ctx.moveTo(sx, sy);
	ctx.lineTo(ex, ey);
	ctx.stroke();
	ctx.restore();
}


export function makeColorTableImage(ctOrBand,width,height) {
	const div    = width / 254;
	const canvas= createCanvas(width,height);
	const ctx= canvas.getContext('2d');
	const band= isTypedArray(ctOrBand) ? Band.NO_BAND : ctOrBand;
    const ct= isTypedArray(ctOrBand) ? ctOrBand : undefined;
	ctx.lineWidth=1;

	for (let i=0; (i<width); i++) {
		const idx= Math.trunc(i/div);
		ctx.strokeStyle= band===Band.NO_BAND ? getCtColor(ct,idx) : get3CColor(band,i);
		drawLine(ctx,band===Band.NO_BAND ? getCtColor(ct,idx) : get3CColor(band,i), 1, i,0, i, height-1);
	}
	return canvas;
}

function get3CColor(band, idx) {
	switch (band) {
		case Band.RED: return toRGBAString(idx, 0, 0, 1);
		case Band.GREEN: return toRGBAString(0, idx, 0, 1);
		case Band.BLUE: return toRGBAString(0, 0, idx, 1);
	}
}

function getCtColor(ct,idx) {
	const pixel= idx*3;
	return toRGBAString( Math.trunc(ct[pixel]*255), Math.trunc(ct[pixel+1]*255), Math.trunc(ct[pixel+2]*255), 1 );
}

const UPPER = 'UPPER';
const LOWER = 'LOWER';

export function makeColorHistImage(ctOrBand,ctId, width,height, hist, histColorIdx) {
	const canvas= createCanvas(width,height);
	const ctx= canvas.getContext('2d');
	const band= isTypedArray(ctOrBand) ? Band.NO_BAND : ctOrBand;
	const ct= isTypedArray(ctOrBand) ? ctOrBand : undefined;
	const bottomColorSize= 4;
	ctx.lineWidth=1;

	ctx.fillStyle= band===Band.NO_BAND  && (ctId===1 || ctId===0) ?
		                      toRGBAString(0xCC, 0xCC, 0x99,1) : toRGBAString(181, 181, 181,1);
	ctx.fillRect(0,0,width,height);

	const upperBounds= -1;
	const lowerBounds= -1;
	const upperBounds2= -1;
	const lowerBounds2= -1;
	const graphWidth= width;
	const graphHeight= height;
	let   y, idx, lastIdx=0, stepSize;

	const       yTop= height - 1;
	const       yBottom= 0;
	const div= graphWidth / hist.length;
	let max= 0;
	let max2= 0;
	let min= Number.MAX_VALUE;
	let markOutOfBounds= false;
	const do2nd= true;

	const lineDataSize= Array(graphWidth);
	const orginalHistogramIdx= Array(graphWidth);
	ctx.strokeStyle= '#000000';
	for(let i=0; (i<hist.length); i++) {
		if (hist[i] > max) max= hist[i];
		if (hist[i] > max2 && hist[i] < max) max2= hist[i];
		if (hist[i] < min) min= hist[i];
	}
	if (do2nd) max= max2;


	const weight= max/(graphHeight-1);
	const maxY= Math.trunc(max / weight) - bottomColorSize;


	for (let i=0; (i<graphWidth); i++) {
		idx= Math.trunc(i/div);
		stepSize= idx-lastIdx;
		lastIdx = idx;

		// if there is not data check the bins before and after,  to find a better line to draw
		if (hist[idx]===0 && stepSize>=3) {
			if (hist[idx-1] > hist[idx+1]) idx= idx-1;
			else                           idx= idx+1;
		}

		y= Math.trunc(hist[idx] / weight);
		if (hist[idx] > 0 && y < 2) y= 2;

		if (y > maxY) {
			y= maxY;
			markOutOfBounds= true;
		}
		else {
			markOutOfBounds= false;
		}
		const cidx= histColorIdx[idx] & 0xFF;
		const color= band===Band.NO_BAND  ? getCtColor(ct,cidx) : get3CColor(band,cidx);

		drawLine(ctx,color, 1, i, yTop, i, yTop-(y+bottomColorSize));
		drawLine(ctx,'#FFFFFF',1,  i, yTop-(y+1+bottomColorSize), i, yTop-(y+1+bottomColorSize));
		lineDataSize[i]       = hist[idx];
		orginalHistogramIdx[i]= idx;
		if (markOutOfBounds) drawOutofBounds(ctx, i, yTop-(y+2+bottomColorSize));

	}


	if (upperBounds2 > -1) drawBounds(ctx,'#0000FF' , Math.trunc(upperBounds2 * div), yTop, yBottom, UPPER);
	if (lowerBounds2 > -1) drawBounds(ctx,'#0000FF',  Math.trunc(lowerBounds2 * div), yTop, yBottom, LOWER);
	if (upperBounds > -1) drawBounds(ctx, '#FF0000', Math.trunc(upperBounds * div), yTop, yBottom, UPPER);
	if (lowerBounds > -1) drawBounds(ctx, '#FF0000', Math.trunc(lowerBounds * div), yTop, yBottom, LOWER);

	return canvas;
}

function drawOutofBounds(ctx, x, y) {
	drawLine(ctx, '#FF0000', 1,  x-1, y+1, x, y);
	drawLine(ctx, '#FF0000', 1 , x+1, y+1, x, y);
}

function drawBounds(ctx, color, x, yTop, yBottom, which) {
	const dir= (which===LOWER) ? 5 : -5;
	drawLine(ctx,color,  1, x, yTop,        x, yBottom);
	drawLine(ctx, color, 1, x+dir, yTop,    x, yTop);
	drawLine(ctx, color, 1, x+dir, yBottom, x, yBottom);
}
