const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()

app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertSnakeCaseToCamelCaseForAPI1 = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

//API 1
app.get('/players/', async (request, response) => {
  const getPlayersDetailsQuery = `
    SELECT 
      *
    FROM 
    player_details;
    `
  const playerDetails = await db.all(getPlayersDetailsQuery)
  response.send(
    playerDetails.map(eachPlayer =>
      convertSnakeCaseToCamelCaseForAPI1(eachPlayer),
    ),
  )
})

//API2
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerDetailQuery = `
     SELECT 
       *
     FROM
     player_details
     WHERE
     player_id = ${playerId}
    `
  const playerDetail = await db.get(getPlayerDetailQuery)
  response.send({
    playerId: playerDetail.player_id,
    playerName: playerDetail.player_name,
  })
})

//API3
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetail = request.body
  const {playerName} = playerDetail

  const updatePlayerDetailQuery = `
     UPDATE
      player_details
    SET 
    player_name = '${playerName}'
    WHERE
    player_id = ${playerId}
  `
  await db.run(updatePlayerDetailQuery)
  //console.log('Player Details Updated')
  response.send('Player Details Updated')
})

//API4
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchDetailQuery = `
     SELECT 
       *
     FROM
     match_details
     WHERE
     match_id = ${matchId}
    `
  const matchDetail = await db.get(getMatchDetailQuery)
  response.send({
    matchId: matchDetail.match_id,
    match: matchDetail.match,
    year: matchDetail.year,
  })
})

//API5
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchIdQuery = `
  SELECT 
    match_details.match_id AS matchId,
    match_details.match AS match,
    match_details.year AS year
  FROM
    player_match_score 
    NATURAL JOIN
    match_details
  WHERE
    player_match_score.player_id = ${playerId};
  `
  const matchDetail = await db.all(getMatchIdQuery)
  // console.log(matchDetail)
  response.send(matchDetail)
})

//API6
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayerIdQuery = `
  SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName
  FROM
    player_match_score 
    NATURAL JOIN
    player_details
  WHERE
    match_id = ${matchId};
  `
  const playerDetail = await db.all(getPlayerIdQuery)
  //console.log(playerDetail)
  response.send(playerDetail)
})

//API7
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerStatsQuery = `

    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    
  `
  const playerStats = await db.get(getPlayerStatsQuery)
  response.send(playerStats)
})

module.exports = app
