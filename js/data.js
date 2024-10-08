"use strict";
/* exported data */
let data = {
    view: readDataView(),
};
let favorites = readFavorites();
let pendingDeletion = '';
let selectedSeason = readSeason();
const rosterteam = readRoster();
let scheduleteam = readScheduleTeam();
const gameid = readStatisticsGameId();
// List of current NHL teams used to filter out old teams from the data returned from the API
const nhlTeams = [
    'DET',
    'BOS',
    'PIT',
    'TBL',
    'PHI',
    'CGY',
    'WSH',
    'VAN',
    'COL',
    'NSH',
    'VGK',
    'DAL',
    'NYR',
    'FLA',
    'EDM',
    'MIN',
    'STL',
    'NYI',
    'LAK',
    'BUF',
    'OTT',
    'TOR',
    'NJD',
    'WPG',
    'SEA',
    'SJS',
    'UTA',
    'CBJ',
    'CHI',
    'ANA',
    'CAR',
    'MTL',
];
// Full list of NHL teams [team names + abbreviations]
const nhlTeamFullName = [
    { fullname: 'Anaheim Ducks', abbrev: 'ANA' },
    { fullname: 'Boston Bruins', abbrev: 'BOS' },
    { fullname: 'Buffalo Sabres', abbrev: 'BUF' },
    { fullname: 'Carolina Hurricanes', abbrev: 'CAR' },
    { fullname: 'Calgary Flames', abbrev: 'CGY' },
    { fullname: 'Chicago Blackhawks', abbrev: 'CHI' },
    { fullname: 'Colorado Avalanche', abbrev: 'COL' },
    { fullname: 'Columbus Blue Jackets', abbrev: 'CBJ' },
    { fullname: 'Dallas Stars', abbrev: 'DAL' },
    { fullname: 'Detroit Red Wings', abbrev: 'DET' },
    { fullname: 'Edmonton Oilers', abbrev: 'EDM' },
    { fullname: 'Florida Panthers', abbrev: 'FLA' },
    { fullname: 'Los Angeles Kings', abbrev: 'LAK' },
    { fullname: 'Minnesota Wild', abbrev: 'MIN' },
    { fullname: 'Montréal Canadiens', abbrev: 'MTL' },
    { fullname: 'Nashville Predators', abbrev: 'NSH' },
    { fullname: 'New Jersey Devils', abbrev: 'NJD' },
    { fullname: 'New York Islanders', abbrev: 'NYI' },
    { fullname: 'New York Rangers', abbrev: 'NYR' },
    { fullname: 'Ottawa Senators', abbrev: 'OTT' },
    { fullname: 'Philadelphia Flyers', abbrev: 'PHI' },
    { fullname: 'Pittsburgh Penguins', abbrev: 'PIT' },
    { fullname: 'San Jose Sharks', abbrev: 'SJS' },
    { fullname: 'Seattle Kraken', abbrev: 'SEA' },
    { fullname: 'St. Louis Blues', abbrev: 'STL' },
    { fullname: 'Tampa Bay Lightning', abbrev: 'TBL' },
    { fullname: 'Toronto Maple Leafs', abbrev: 'TOR' },
    { fullname: 'Utah Hockey Club', abbrev: 'UTA' },
    { fullname: 'Vancouver Canucks', abbrev: 'VAN' },
    { fullname: 'Vegas Golden Knights', abbrev: 'VGK' },
    { fullname: 'Washington Capitals', abbrev: 'WSH' },
    { fullname: 'Winnipeg Jets', abbrev: 'WPG' },
    { fullname: '', abbrev: '' },
];
// Function to update the DOM with team data
function updateDOMTeams(teams) {
    const $table = document.querySelector('.teams-table');
    if (!$table)
        throw new Error('The $table query failed');
    // Find the tbody element within the table
    const $tbody = $table.querySelector('tbody');
    if (!$tbody)
        throw new Error('The tbody query failed');
    // Clear existing rows in the tbody
    while ($tbody.rows.length > 0) {
        $tbody.deleteRow(0);
    }
    // Add new rows based on the teams data
    teams.forEach((team) => {
        // Create a new row
        const $row = $tbody.insertRow();
        // Create cells for each row
        const $teamNameCell = $row.insertCell();
        $teamNameCell.textContent = team.fullName;
        const $abbreviationCell = $row.insertCell();
        $abbreviationCell.textContent = team.triCode;
        const $rosterCell = $row.insertCell();
        const numericseasonvalue = Number(readSeason().substring(0, 4));
        // Check conditions to decide whether to create the roster link
        if (!(team.triCode === 'UTA' && numericseasonvalue !== 2024) &&
            !(team.triCode === 'SEA' && numericseasonvalue < 2021) &&
            !(team.triCode === 'VGK' && numericseasonvalue < 2017)) {
            const $rosterLink = document.createElement('a');
            $rosterLink.href = '#';
            $rosterLink.textContent = 'Roster';
            $rosterLink.className = 'roster-link';
            // Add click event listener to the roster link
            $rosterLink.addEventListener('click', (event) => {
                event.preventDefault();
                const abbreviation = $abbreviationCell.textContent ?? '';
                const fullteamname = $teamNameCell.textContent ?? '';
                updateRoster(fullteamname, abbreviation, selectedSeason);
                writeRoster(abbreviation);
                viewSwap('roster');
            });
            $rosterCell.appendChild($rosterLink);
        }
        const $scheduleCell = $row.insertCell();
        // Check conditions to decide whether to create the schedule link
        if (!(team.triCode === 'UTA' && numericseasonvalue !== 2024) &&
            !(team.triCode === 'SEA' && numericseasonvalue < 2021) &&
            !(team.triCode === 'VGK' && numericseasonvalue < 2017)) {
            const $scheduleLink = document.createElement('a');
            $scheduleLink.href = '#';
            $scheduleLink.textContent = 'Schedule';
            $scheduleLink.className = 'schedule-link';
            // Add click event listener to the schedule link
            $scheduleLink.addEventListener('click', (event) => {
                event.preventDefault();
                const abbreviation = $abbreviationCell.textContent ?? '';
                const fullteamname = $teamNameCell.textContent ?? '';
                scheduleteam = abbreviation;
                writeScheduleTeam(abbreviation);
                updateSchedule(fullteamname, abbreviation, selectedSeason);
                populateScheduleSeasonDropdown(selectedSeason);
                populateTeamsDropdown(abbreviation);
                viewSwap('schedule');
            });
            $scheduleCell.appendChild($scheduleLink);
        }
        const $actionsCell = $row.insertCell();
        const $faveButton = document.createElement('a');
        $faveButton.href = '#';
        $faveButton.className = 'fa-regular fa-star';
        // Add click event listener to the favorite button
        $faveButton.addEventListener('click', (event) => {
            event.preventDefault();
            const abbreviation = $abbreviationCell.textContent ?? '';
            if ($faveButton.className === 'fa-regular fa-star') {
                $faveButton.className = 'fa-solid fa-star';
                addfavorites(abbreviation);
                updateTeams();
            }
            else {
                showconfirmation(abbreviation);
                pendingdelete(abbreviation);
            }
        });
        $actionsCell.appendChild($faveButton);
    });
    updateFavoriteIcons();
}
// Function to update the DOM with roster data
function updateDOMRoster(nhlteamRoster) {
    const $table = document.querySelector('.roster-table');
    if (!$table)
        throw new Error('The $table query failed');
    // Find the tbody element within the table
    const $tbody = $table.querySelector('tbody');
    if (!$tbody)
        throw new Error('The tbody query failed');
    // Clear existing rows in the tbody
    while ($tbody.rows.length > 0) {
        $tbody.deleteRow(0);
    }
    // Add new rows based on the teams data
    for (let i = 0; i < nhlteamRoster.length; i++) {
        // Create a new row
        const $row = $tbody.insertRow();
        // Create cells for each row
        const $seasonCell = $row.insertCell();
        $seasonCell.textContent =
            nhlteamRoster[i].season.slice(0, 4) +
                '-' +
                nhlteamRoster[i].season.slice(4);
        const $teamCell = $row.insertCell();
        $teamCell.textContent = nhlteamRoster[i].team;
        const $playerimageCell = $row.insertCell();
        const $playerimage = document.createElement('img');
        $playerimage.src = nhlteamRoster[i].image;
        $playerimageCell.appendChild($playerimage);
        const $jerseyCell = $row.insertCell();
        $jerseyCell.textContent = '#' + nhlteamRoster[i].jersey;
        const $fullNameCell = $row.insertCell();
        $fullNameCell.textContent = nhlteamRoster[i].fullname;
        const $positionCell = $row.insertCell();
        $positionCell.textContent = nhlteamRoster[i].position;
        const $hometownCell = $row.insertCell();
        $hometownCell.textContent = nhlteamRoster[i].hometown;
    }
    const $rosterHeader = document.querySelector('.roster-section');
    if (!$rosterHeader)
        throw new Error('The $rosterHeader query failed');
    $rosterHeader.textContent =
        nhlteamRoster[0].fullteamname +
            ' Roster (' +
            nhlteamRoster[0].season.slice(0, 4) +
            '-' +
            nhlteamRoster[0].season.slice(4) +
            ')';
}
// Function to update the DOM with roster data
function updateDOMSchedule(nhlteamSchedule) {
    const $table = document.querySelector('.schedule-table');
    if (!$table)
        throw new Error('The $table query failed');
    // Find the tbody element within the table
    const $tbody = $table.querySelector('tbody');
    if (!$tbody)
        throw new Error('The tbody query failed');
    // Clear existing rows in the tbody
    while ($tbody.rows.length > 0) {
        $tbody.deleteRow(0);
    }
    //Update the title on the page based on selected teams
    const $scheduleTitle = document.querySelector('.schedule-section');
    if (!$scheduleTitle)
        throw new Error('$scheduleTitle is null');
    if (readScheduleTeam() !== '' &&
        !(readScheduleTeam() === 'UTA' && readSeason() !== '20242025') &&
        !(readScheduleTeam() == 'SEA' && Number(readSeason().substring(0, 4)) < 2021) &&
        !(readScheduleTeam() == 'VGK' && Number(readSeason().substring(0, 4)) < 2017)) {
        $scheduleTitle.textContent = 'Season Schedule';
    }
    else {
        $scheduleTitle.textContent =
            'Please select a valid team/season combination to see the full season schedule.';
    }
    // Add new rows based on the teams data
    for (let i = 0; i < nhlteamSchedule.length; i++) {
        // Create a new row
        const $row = $tbody.insertRow();
        // Create cells for each row
        const $gameidCell = $row.insertCell();
        $gameidCell.textContent = (i + 1).toString();
        const $awayTeamCell = $row.insertCell();
        $awayTeamCell.innerHTML =
            getFullName(nhlteamSchedule[i].awayteamcode) + '<br>';
        const $awayteamimage = document.createElement('img');
        $awayteamimage.src = nhlteamSchedule[i].awayteamlogo;
        $awayTeamCell.appendChild($awayteamimage);
        const $homeTeamCell = $row.insertCell();
        $homeTeamCell.innerHTML =
            '@ ' + getFullName(nhlteamSchedule[i].hometeamcode) + '<br>';
        const $hometeamimage = document.createElement('img');
        $hometeamimage.src = nhlteamSchedule[i].hometeamlogo;
        $homeTeamCell.appendChild($hometeamimage);
        const formatdate = nhlteamSchedule[i].gamedate.slice(5, 7) +
            '/' +
            nhlteamSchedule[i].gamedate.slice(8, 10) +
            '/' +
            nhlteamSchedule[i].gamedate.slice(0, 4);
        const offsetVenue = Number(nhlteamSchedule[i].venuetime.slice(0, 3));
        const utchours = Number(nhlteamSchedule[i].starttime.slice(11, 13));
        let localhours = '';
        if (utchours + offsetVenue > 0) {
            localhours = (utchours + offsetVenue - 12).toString();
        }
        else {
            localhours = (utchours + 24 + offsetVenue - 12).toString();
        }
        const $dateCell = $row.insertCell();
        $dateCell.innerHTML =
            formatdate +
                ' <br>' +
                localhours +
                ':' +
                nhlteamSchedule[i].starttime.slice(14, 16) +
                ' PM';
        let score = '';
        if (nhlteamSchedule[i].awayteamscore > nhlteamSchedule[i].hometeamscore) {
            score =
                nhlteamSchedule[i].awayteamcode +
                    ' (W): ' +
                    nhlteamSchedule[i].awayteamscore +
                    '<br><br>' +
                    nhlteamSchedule[i].hometeamcode +
                    ' (L): ' +
                    nhlteamSchedule[i].hometeamscore;
        }
        else if (nhlteamSchedule[i].awayteamscore < nhlteamSchedule[i].hometeamscore) {
            score =
                nhlteamSchedule[i].awayteamcode +
                    ' (L): ' +
                    nhlteamSchedule[i].awayteamscore +
                    '<br><br>' +
                    nhlteamSchedule[i].hometeamcode +
                    ' (W): ' +
                    nhlteamSchedule[i].hometeamscore;
        }
        else if (nhlteamSchedule[i].awayteamscore === nhlteamSchedule[i].hometeamscore &&
            nhlteamSchedule[i].awayteamscore > 0) {
            score =
                nhlteamSchedule[i].awayteamcode +
                    ' (Tie): ' +
                    nhlteamSchedule[i].awayteamscore +
                    '<br><br>' +
                    nhlteamSchedule[i].hometeamcode +
                    ' (Tie): ' +
                    nhlteamSchedule[i].hometeamscore;
        }
        const $scoreCell = $row.insertCell();
        $scoreCell.innerHTML = score;
        const $venueCell = $row.insertCell();
        $venueCell.textContent = nhlteamSchedule[i].venuename;
        const $keyStatsCell = $row.insertCell();
        const $keyStatsLink = document.createElement('a');
        $keyStatsLink.href = '#';
        if (score === '') {
            $keyStatsLink.textContent = '';
        }
        else {
            $keyStatsLink.textContent = 'Key Statistics';
        }
        $keyStatsLink.className = 'key-stats-link';
        $keyStatsCell.appendChild($keyStatsLink);
        // Add click event listener to the key stats link
        $keyStatsLink.addEventListener('click', (event) => {
            event.preventDefault();
            const gameid = nhlteamSchedule[i].gameid;
            updateStatistics(gameid);
            writeStatisticsGameId(gameid);
            viewSwap('key-stats');
        });
    }
}
// Function to update the DOM with roster data
function updateDOMStatistics(nhlgamestats) {
    // Get formatted info for header
    const awayteamName = getFullName(nhlgamestats.awayteamcode);
    const hometeamName = getFullName(nhlgamestats.hometeamcode);
    const formatdate = nhlgamestats.gamedate.slice(5, 7) +
        '/' +
        nhlgamestats.gamedate.slice(8, 10) +
        '/' +
        nhlgamestats.gamedate.slice(0, 4);
    // Find header element and update
    const $statsHeader = document.querySelector('.stats-section');
    if (!$statsHeader)
        throw new Error('$statsHeader is not available');
    $statsHeader.innerHTML = `${awayteamName}<br>@ ${hometeamName}<br>${formatdate}<br>${nhlgamestats.venuename}`;
    // Find the table element
    const $table = document.querySelector('.stats-table');
    if (!$table)
        throw new Error('The $table query failed');
    // Find the tbody element within the table
    const $tbody = $table.querySelector('tbody');
    if (!$tbody)
        throw new Error('The tbody query failed');
    // Find the theader element within the table
    const $thead = $table.querySelector('thead');
    if (!$thead)
        throw new Error('The thead query failed');
    const $awayheaderimage = $table.querySelector('.img-away-team');
    if (!$awayheaderimage)
        throw new Error('The awayheaderimage query failed');
    const $homeheaderimage = $table.querySelector('.img-home-team');
    if (!$homeheaderimage)
        throw new Error('The homeheaderimage query failed');
    // Away Team Header Update
    $awayheaderimage.setAttribute('src', nhlgamestats.awayteamlogo);
    $awayheaderimage.textContent = awayteamName;
    // Home Team Header Update
    $homeheaderimage.setAttribute('src', nhlgamestats.hometeamlogo);
    // Score Updates
    $tbody.rows[0].cells[1].innerHTML = nhlgamestats.awayteamscore.toString();
    $tbody.rows[0].cells[2].innerHTML = nhlgamestats.hometeamscore.toString();
    // SOG Updates
    $tbody.rows[1].cells[1].innerHTML = nhlgamestats.awayteamSOG.toString();
    $tbody.rows[1].cells[2].innerHTML = nhlgamestats.hometeamSOG.toString();
    // Face Off Winning % Updates
    $tbody.rows[2].cells[1].innerHTML = nhlgamestats.awayteamAssists.toString();
    $tbody.rows[2].cells[2].innerHTML = nhlgamestats.hometeamAssists.toString();
    // Power Play Updates
    $tbody.rows[3].cells[1].innerHTML = nhlgamestats.awayteamPP.toString();
    $tbody.rows[3].cells[2].innerHTML = nhlgamestats.hometeamPP.toString();
    // Penalty Infraction Minutes Updates
    $tbody.rows[4].cells[1].innerHTML = nhlgamestats.awayteamPIM.toString();
    $tbody.rows[4].cells[2].innerHTML = nhlgamestats.hometeamPIM.toString();
    // Hits Updates
    $tbody.rows[5].cells[1].innerHTML = nhlgamestats.awayteamHits.toString();
    $tbody.rows[5].cells[2].innerHTML = nhlgamestats.hometeamHits.toString();
    // Blocked Shots Updates
    $tbody.rows[6].cells[1].innerHTML = nhlgamestats.awayteamBlocked.toString();
    $tbody.rows[6].cells[2].innerHTML = nhlgamestats.hometeamBlocked.toString();
}
// function to swap views between schedule, teams, roster, and statistics
function viewSwap(viewName) {
    const $teams = document.querySelector("div[data-view='teams']");
    const $roster = document.querySelector("div[data-view='roster']");
    const $schedule = document.querySelector("div[data-view='schedule']");
    const $stats = document.querySelector("div[data-view='key-stats']");
    const $scheduleNoUnderline = document.querySelector('.header-links-schedule');
    const $scheduleUnderline = document.querySelector('.header-links-schedule-underlined');
    const $teamNoUnderline = document.querySelector('.header-links-team');
    const $teamUnderline = document.querySelector('.header-links-team-underlined');
    if (!$teams)
        throw new Error('$teams is null');
    if (!$roster)
        throw new Error('$roster is null');
    if (!$schedule)
        throw new Error('$schedule is null');
    if (!$stats)
        throw new Error('$stats is null');
    if (viewName === 'teams') {
        $roster.setAttribute('class', 'hidden');
        $schedule.setAttribute('class', 'hidden');
        $stats.setAttribute('class', 'hidden');
        $teams.setAttribute('class', '');
        data.view = 'teams';
        localStorage.setItem('data-view', data.view);
        $scheduleUnderline?.setAttribute('class', 'header-links-schedule');
        $teamNoUnderline?.setAttribute('class', 'header-links-team-underlined');
    }
    else if (viewName === 'roster') {
        $teams.setAttribute('class', 'hidden');
        $schedule.setAttribute('class', 'hidden');
        $stats.setAttribute('class', 'hidden');
        $roster.setAttribute('class', '');
        data.view = 'roster';
        localStorage.setItem('data-view', data.view);
        $teamUnderline?.setAttribute('class', 'header-links-team');
        $scheduleUnderline?.setAttribute('class', 'header-links-schedule');
    }
    else if (viewName === 'schedule') {
        $teams.setAttribute('class', 'hidden');
        $roster.setAttribute('class', 'hidden');
        $stats.setAttribute('class', 'hidden');
        $schedule.setAttribute('class', '');
        data.view = 'schedule';
        localStorage.setItem('data-view', data.view);
        $scheduleNoUnderline?.setAttribute('class', 'header-links-schedule-underlined');
        $teamUnderline?.setAttribute('class', 'header-links-team');
    }
    else if (viewName === 'key-stats') {
        $teams.setAttribute('class', 'hidden');
        $roster.setAttribute('class', 'hidden');
        $schedule.setAttribute('class', 'hidden');
        $stats.setAttribute('class', '');
        data.view = 'key-stats';
        localStorage.setItem('data-view', data.view);
        $scheduleUnderline?.setAttribute('class', 'header-links-schedule');
        $teamUnderline?.setAttribute('class', 'header-links-team');
    }
}
// show favorites modal confirmation
function showconfirmation(abbreviation) {
    const $dialog = document.querySelector('dialog');
    if (!$dialog)
        throw new Error('$dialog does not exist');
    $dialog.showModal();
}
// add team to favorites after clicking on the star
function addfavorites(abbreviation) {
    favorites.push(abbreviation);
    writeFavorites();
}
// write favorites to local storage so that they are retained on page refresh
function writeFavorites() {
    const favoritesJSON = JSON.stringify(favorites);
    localStorage.setItem('favorites', favoritesJSON);
}
// read favorites from local storage so that they utilized after a page refresh
function readFavorites() {
    let newFavorites = [];
    const readJSON = localStorage.getItem('favorites');
    if (readJSON === null) {
        newFavorites = [];
    }
    else {
        newFavorites = JSON.parse(readJSON);
    }
    return newFavorites;
}
// Keep favorited teams with correct icon indicating them as favorite
function updateFavoriteIcons() {
    const favorites = readFavorites();
    // Ensure the tableBody is selected correctly
    const tableBody = document.querySelector('.teams-table tbody');
    // Check if tableBody exists
    if (!tableBody) {
        console.error('Table body not found.');
        return;
    }
    for (const row of tableBody.rows) {
        // Get the abbreviation cell
        const abbrevCell = row.cells[1];
        // Check if the cell's text content matches a favorite
        if (favorites.includes(abbrevCell.textContent?.trim() || '')) {
            // Get the favorite icon cell
            const favoriteCell = row.cells[4].children[0];
            if (favoriteCell) {
                // Update the favorite star to indicate it is a favorite
                favoriteCell.className = 'fa-solid fa-star';
            }
        }
    }
}
// Store team that is pending deletion from favorites
function pendingdelete(abbreviation) {
    pendingDeletion = abbreviation;
}
// Removed team from favorites
function removeFavorites(pendingDeletion) {
    const currentFavorites = readFavorites();
    for (let i = 0; i < currentFavorites.length; i++) {
        if (currentFavorites[i] === pendingDeletion) {
            currentFavorites.splice(i, 1);
        }
    }
    return currentFavorites;
}
// Populate team's dropdown on the schedules page with teams
function populateTeamsDropdown(teamabbrev) {
    const $teamdropdown = document.getElementById('teamName');
    if (!$teamdropdown)
        throw new Error('$teamdropdown is null');
    // Clear existing options from dropdown
    $teamdropdown.innerHTML = '';
    // Create and append options based on nhlTeamFullName list
    for (let i = 0; i < nhlTeamFullName.length; i++) {
        const optionElement = document.createElement('option');
        optionElement.value = nhlTeamFullName[i].abbrev;
        optionElement.textContent = nhlTeamFullName[i].fullname;
        $teamdropdown.appendChild(optionElement);
    }
    $teamdropdown.value = teamabbrev;
}
function populateScheduleSeasonDropdown(season) {
    const $seasonScheduledropdown = document.getElementById('scheduleSeasonDropdown');
    if (!$seasonScheduledropdown)
        throw new Error('$seasonScheduledropdown is null');
    $seasonScheduledropdown.value = season;
    selectedSeason = season;
    writeSeason(selectedSeason);
}
function populateSeasonDropdown(season) {
    const $SeasonDropdown = document.getElementById('scheduleSeason');
    if (!$SeasonDropdown)
        throw new Error('$SeasonDropdown is null');
    $SeasonDropdown.value = season;
}
// read data-view from local storage so that it is utilized after a page refresh
function readDataView() {
    let newdataview = '';
    const readJSON = localStorage.getItem('data-view');
    if (readJSON === null) {
        newdataview = 'teams';
    }
    else {
        newdataview = readJSON;
    }
    return newdataview;
}
// write season to local storage so that it can be used
function writeSeason(selectedSeason) {
    localStorage.setItem('season', selectedSeason);
}
// read data-view from local storage so that it is utilized after a page refresh
function readSeason() {
    let newseason = '';
    const readJSON = localStorage.getItem('season');
    if (readJSON === null) {
        newseason = '20242025';
    }
    else {
        newseason = readJSON;
    }
    return newseason;
}
// write season to local storage so that it can be used
function writeRoster(abbrev) {
    localStorage.setItem('roster-team', abbrev);
}
// read data-view from local storage so that it is utilized after a page refresh
function readRoster() {
    let roster = '';
    const readJSON = localStorage.getItem('roster-team');
    if (readJSON === null) {
        roster = '';
    }
    else {
        roster = readJSON;
    }
    return roster;
}
function getFullName(abbrev) {
    let fullTeamName = '';
    for (let i = 0; i < nhlTeamFullName.length; i++) {
        if (nhlTeamFullName[i].abbrev === abbrev) {
            fullTeamName = nhlTeamFullName[i].fullname;
        }
    }
    return fullTeamName;
}
// write season to local storage so that it can be used
function writeScheduleTeam(abbrev) {
    localStorage.setItem('schedule-team', abbrev);
}
// read data-view from local storage so that it is utilized after a page refresh
function readScheduleTeam() {
    let scheduleteam = '';
    const readJSON = localStorage.getItem('schedule-team');
    if (readJSON === null) {
        scheduleteam = '';
    }
    else {
        scheduleteam = readJSON;
    }
    return scheduleteam;
}
// write season to local storage so that it can be used
function writeStatisticsGameId(gameid) {
    localStorage.setItem('stats-game', gameid);
}
// read data-view from local storage so that it is utilized after a page refresh
function readStatisticsGameId() {
    let statsGame = '';
    const readJSON = localStorage.getItem('stats-game');
    if (readJSON === null) {
        statsGame = '';
    }
    else {
        statsGame = readJSON;
    }
    return statsGame;
}
function clearSchedule() {
    const $table = document.querySelector('.schedule-table');
    if (!$table)
        throw new Error('The $table query failed');
    // Find the tbody element within the table
    const $tbody = $table.querySelector('tbody');
    if (!$tbody)
        throw new Error('The tbody query failed');
    // Clear existing rows in the tbody
    while ($tbody.rows.length > 0) {
        $tbody.deleteRow(0);
    }
}
