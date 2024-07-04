const BASE_API_URL = "https://rithm-jeopardy.herokuapp.com/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;

// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  // ask for 100 categories [most we can ask for], so we can pick random ones
  let response = await axios.get(`${BASE_API_URL}categories?count=100`);
  // Get an array of category IDs from the response
  let catIds = response.data.map((category) => category.id);
  // Return a random selection of NUM_CATEGORIES category IDs using lodash*
  return _.sampleSize(catIds, NUM_CATEGORIES);
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null, value: 200},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null, value: 400},
 *      ...
 *   ]
 */

async function getCategory(catId) {
  // Fetch data for a specific category ID from the API
  let response = await axios.get(`${BASE_API_URL}category?id=${catId}`);

  let cat = response.data;
  // Get a random selection of NUM_CLUES_PER_CAT clues using lodash*
  let randomClues = _.sampleSize(cat.clues, NUM_CLUES_PER_CAT).map((clue) => ({
    question: clue.question,
    answer: clue.answer,
    showing: null,
  }));
  // Return the category title and the selected clues
  return { title: cat.title, clues: randomClues };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initially, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
  hideLoadingView();

  // Create table row with headers for category titles
  let $tr = $("<tr>");
  for (let category of categories) {
    $tr.append($("<th>").text(category.title));
  }
  $("#jeopardy thead").append($tr);

  // Create table rows with questions for each category
  $("#jeopardy tbody").empty();
  for (let clueIdx = 0; clueIdx < NUM_CLUES_PER_CAT; clueIdx++) {
    let $tr = $("<tr>");
    for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
      $tr.append(
        $("<td>")
          .attr("id", `${catIdx}-${clueIdx}`)
          .append($("<i>").addClass("fas fa-question-circle fa-3x"))
      );
    }
    $("#jeopardy tbody").append($tr);
  }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(event) {
  let $target = $(event.target);
  let id = $target.attr("id");
  let [catId, clueId] = id.split("-");
  let clue = categories[catId].clues[clueId];


  // Show the question if not already showing
  if (!clue.showing) {
    msg = clue.question;
    clue.showing = "question";
    // Show the answer if the question is currently showing
  } else if (clue.showing === "question") {
    msg = clue.answer;
    clue.showing = "answer";
    $target.addClass("disabled");
    // If the answer is already showing, ignore the click
  } else {
    return;
  }

  // Update text of table cell
  $target.html(msg);
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
  // Clear the board
  $("#jeopardy thead").empty();
  $("#jeopardy tbody").empty();

  // Show the loading icon
  $("#spin-container").show();
  $("#start").addClass("disabled").text("Loading...");
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
  $("#start").removeClass("disabled").text("Start a New Game!");
  $("#spin-container").hide();
}

//Start game:
  //get random category Ids
 //get data for each category
  //create HTML table
 

async function setupAndStart() {
  // Check if the game is currently loading
  let isLoading = $("#start").text() === "Loading...";

  if (!isLoading) {
    showLoadingView();

    // Get random category IDs
    let catIds = await getCategoryIds();

    categories = [];

    for (let catId of catIds) {
      categories.push(await getCategory(catId));
    }
    // Fill the table with the retrieved data
    fillTable();
  }
}

/** On click of start / restart button, set up game. */

$("#start").on("click", setupAndStart);

/** On page load, add event handler for clicking clues */

$(async function () {
  $("#jeopardy").on("click", "td", handleClick);
});
