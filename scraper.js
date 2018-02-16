const rp = require('request-promise');
const cheerio = require('cheerio');
const tough = require('tough-cookie');
const Match = require('./models/MatchModel');

var express = require('express');
var router = express.Router();

class OddsFinderScraper {

  constructor() {
    this.services = {
      betway: {
        name: 'Betway',
        region: 'Kenya'
      },
      merryBet: {
        name: 'MerryBet',
        region: 'Nigeria'
      },
      princessBet: {
        name: 'PrincessBet',
        region: 'Tanzania'
      },
      betPawa: {
        name: 'BetPawa',
        region: 'Kenya'
      },
      lovingBet: {
        name: 'LovingBet',
        region: 'Nigeria'
      },
      sportPesa: {
        name: 'SportPesa',
        region: 'Kenya'
      },
      betIn: {
        name: 'BetIn',
        region: 'Kenya'
      },
      betika: {
        name: 'Betika',
        region: 'Kenya'
      },
      x1bet: {
        name: '1xBet',
        region: 'Kenya'
      }
    }
    this.leagues = {
      premierLeague: 'Premier League',
      eflCup: 'League Cup',
      laLiga: 'La Liga',
      serieA: 'Serie A',
      ligue1: 'Ligue 1',
      bundesliga: 'Bundesliga'
    }
  }

  scrapeBetwayPremierLeague() {
    return this.startBetwayScraper('94c4842a-5fbb-4510-89db-347b98bd3d35', this.leagues.premierLeague);
  }

  scrapeBetwayEFLCup() {
    return this.startBetwayScraper('8a2c7c20-79a8-49c4-b36a-3940cbb08fb7', this.leagues.eflCup);
  }

  scrapeBetwayLaLiga() {
    return this.startBetwayScraper('dcd52e45-3c2f-4ebd-acb1-bfeb96dd133d', this.leagues.laLiga);
  }

  scrapeBetwaySerieA() {
    return this.startBetwayScraper('563c3241-bf03-478b-8133-0bf5b222febb', this.leagues.serieA);
  }

  scrapeBetwayLigue1() {
    return this.startBetwayScraper('284a32ce-a8f0-464e-8b99-ad0fc2f571d1', this.leagues.ligue1);
  }

  scrapeBetwayBundesliga() {
    return this.startBetwayScraper('9e46daea-dd10-4be0-8eff-1ce479f49cf3', this.leagues.bundesliga);
  }

  startBetwayScraper(leagueId, league) {
    return new Promise((resolve, reject) => {
      let cookie1 = new tough.Cookie({
          key: "ASP.NET_SessionId",
          value: "nzrzspfiq2zartrybn5jp11b",
          domain: 'www.betway.co.ke',
          httpOnly: true,
          maxAge: 3
      });

      var cookiejar = rp.jar();
      cookiejar.setCookie(cookie1, 'https://www.betway.co.ke/Event/FilterEvents');

      var options = {
        method: 'POST',
        uri: 'https://www.betway.co.ke/Event/FilterEvents',
        form: {
          couponTypeId: undefined,
          leagueIds: [
            leagueId
          ],
          marketTypeCategoryId: "00000000-0000-0000-da7a-000000580001"
        },
        jar: cookiejar,
        transform: function (body) {
            return cheerio.load(body);
        }
      };

      rp(options)
        .then($ => {
          let matches = [];
          $('.eventRow').each((ind, val) => {
            matches.push(this.parseBetwayMatches($, val, this.services.betway.name, this.services.betway.region, league));
          })
          Promise.all(matches)
            .then(data => {
              resolve();
            })
            .catch(err => {
              reject(err);
            });
        })
        .catch(err => {
            reject(err);
        });
    })
  }

  parseBetwayMatches($, val, service, region, league) {
    return new Promise((resolve, reject) => {
      let elData = $(val).data();
      let prices = $(val).find('.outcome-pricedecimal');
      let psuedoKey = (elData.eventtitle.split(' v ')[0].split(' ').join('') + '-' + elData.eventtitle.split(' v ')[1].split(' ').join('') + '-' + new Date(elData.eventdate).getTime()).toLowerCase();
      Match.find({}, (err, matches) => {
        let existing = this.findExisting(psuedoKey, matches);

        if (existing && existing._doc.League === league) {
          var matching = existing._doc.MatchInstances.find(el => {
            return el._doc.Service === service;
          })
          if (typeof matching === 'undefined') {
            existing._doc.MatchInstances.push({
              PsuedoKey: psuedoKey,
              Service: service,
              Region: region,
              Team1: {
                Name: elData.eventtitle.split(' v ')[0],
                Price: $($(val).find('.outcome-pricedecimal')[0]).text().trim()
              },
              Team2: {
                Name: elData.eventtitle.split(' v ')[1],
                Price: $($(val).find('.outcome-pricedecimal')[2]).text().trim()
              },
              DrawPrice: $($(val).find('.outcome-pricedecimal')[1]).text().trim()
            })

            existing.markModified('MatchInstances');
            
            existing.save((err, updatedMatch) => {
              if (err) {
                console.log(err);
                reject();
              }
              resolve(updatedMatch);
            });
          }
        } else {
          new Match({
            PsuedoKey: psuedoKey,
            Sport: elData.sporttitle,
            League: league,
            Date: new Date(elData.eventdate).toISOString(),
            Team1: elData.eventtitle.split(' v ')[0],
            Team2: elData.eventtitle.split(' v ')[1],
            MatchInstances: [{
              PsuedoKey: psuedoKey,
              Service: service,
              Region: region,
              Team1: {
                Name: elData.eventtitle.split(' v ')[0],
                Price: $($(val).find('.outcome-pricedecimal')[0]).text().trim()
              },
              Team2: {
                Name: elData.eventtitle.split(' v ')[1],
                Price: $($(val).find('.outcome-pricedecimal')[2]).text().trim()
              },
              DrawPrice: $($(val).find('.outcome-pricedecimal')[1]).text().trim()
            }]
          }).save((err, newMatch) => {
            if (err) {
              console.log(err);
              reject();
            }
            resolve(newMatch);
          });
        }
      })
    })
  }

  scrapeMerryBetPremierLeague() {
    return this.startMerryBetScraper('1060', this.leagues.premierLeague);
  }

  scrapeMerryBetEFLCup() {
    return this.startMerryBetScraper('1627', this.leagues.eflCup);
  }

  scrapeMerryBetLaLiga() {
    return this.startMerryBetScraper('1587', this.leagues.laLiga);
  }

  scrapeMerryBetSerieA() {
    return this.startMerryBetScraper('3340', this.leagues.serieA);
  }

  scrapeMerryBetLigue1() {
    return this.startMerryBetScraper('1648', this.leagues.ligue1);
  }

  scrapeMerryBetBundesliga() {
    return this.startMerryBetScraper('1087', this.leagues.bundesliga);
  }

  startMerryBetScraper(leagueId, league) {
    return new Promise((resolve, reject) => {
      var options = {
        method: 'GET',
        uri: 'https://www.merrybet.com/rest/market/category/events/' + leagueId + '/1',
        json: true
      };

      rp(options)
        .then(res => {
          let resMatches = res.data;
          let matches = [];
          for (let match of resMatches) {
            matches.push(this.parseMerryBetJSONMatches(match, this.services.merryBet.name, this.services.merryBet.region, league));
          }
          Promise.all(matches)
            .then(data => {
              resolve();
            })
            .catch(err => {
              reject(err);
            });
        })
        .catch(err => {
            reject(err);
        });
      
    })
  }

  parseMerryBetJSONMatches(match, service, region, league) {
    return new Promise((resolve, reject) => {
      let sport = match.category1Name;
      let psuedoKey = (match.eventGames[0].outcomes[0].outcomeName.split(' ').join('') + '-' + match.eventGames[0].outcomes[2].outcomeName.split(' ').join('') + '-' + new Date(match.eventStart).getTime()).toLowerCase();
      Match.find({}, (err, matches) => {
        let existing = this.findExisting(psuedoKey, matches);

        if (existing) {
          var matching = existing._doc.MatchInstances.find(el => {
            return el._doc.Service === service;
          })
          if (typeof matching === 'undefined') {
            existing._doc.MatchInstances.push({
              PsuedoKey: psuedoKey,
              Service: service,
              Region: region,
              Team1: {
                Name: match.eventGames[0].outcomes[0].outcomeName,
                Price: match.eventGames[0].outcomes[0].outcomeOdds
              },
              Team2: {
                Name: match.eventGames[0].outcomes[2].outcomeName,
                Price: match.eventGames[0].outcomes[2].outcomeOdds
              },
              DrawPrice: match.eventGames[0].outcomes[1].outcomeOdds
            })

            existing.markModified('MatchInstances');
            
            existing.save((err, updatedMatch) => {
              if (err) {
                console.log(err);
                reject();
              }
              resolve(updatedMatch);
            });
          }
        } else {
          new Match({
            PsuedoKey: psuedoKey,
            Sport: sport,
            League: league,
            Date: new Date(match.eventStart).toISOString(),
            Team1: match.eventGames[0].outcomes[0].outcomeName,
            Team2: match.eventGames[0].outcomes[2].outcomeName,
            MatchInstances: [{
              PsuedoKey: psuedoKey,
              Service: service,
              Region: region,
              Team1: {
                Name: match.eventGames[0].outcomes[0].outcomeName,
                Price: match.eventGames[0].outcomes[0].outcomeOdds
              },
              Team2: {
                Name: match.eventGames[0].outcomes[2].outcomeName,
                Price: match.eventGames[0].outcomes[2].outcomeOdds
              },
              DrawPrice: match.eventGames[0].outcomes[1].outcomeOdds
            }]
          }).save((err, newMatch) => {
            if (err) {
              console.log(err);
              reject();
            }
            resolve(newMatch);
          });
        }
      });
    })
  }

  scrapePrincessBetPremierLeague() {
    return this.startPrincessBetScraper('58944', this.leagues.premierLeague);
  }

  scrapePrincessBetEFLCup() {
    return this.startPrincessBetScraper('74303', this.leagues.eflCup);
  }

  scrapePrincessBetLaLiga() {
    return this.startPrincessBetScraper('59174', this.leagues.laLiga);
  }

  scrapePrincessBetSerieA() {
    return this.startPrincessBetScraper('59245', this.leagues.serieA);
  }

  scrapePrincessBetLigue1() {
    return this.startPrincessBetScraper('58931', this.leagues.ligue1);
  }

  scrapePrincessBetBundesliga() {
    return this.startPrincessBetScraper('59390', this.leagues.bundesliga);
  }

  startPrincessBetScraper(leagueId, league) {
    return new Promise((resolve, reject) => {
      var options = {
        method: 'POST',
        uri: 'http://princessbet.co.tz/api/leagues',
        body: [leagueId],
        json: true
      };

      rp(options)
        .then(res => {
          let resMatches = res[0].countries[0].leagues[0].events;
          let matches = [];
          for (let match of resMatches) {
            matches.push(this.parsePrincessBetJSONMatches(match, this.services.princessBet.name, this.services.princessBet.region, league));
          }
          Promise.all(matches)
            .then(data => {
              resolve();
            })
            .catch(err => {
              reject(err);
            });
        })
        .catch(err => {
            reject(err);
        });
      
    })
  }

  parsePrincessBetJSONMatches(match, service, region, league) {
    return new Promise((resolve, reject) => {
      let sport = "Soccer";
      let odds = match.markets.find(el => {
        return el.name === '3 Way ';
      });
      let psuedoKey = (match.team1.split(' ').join('') + '-' + match.team2.split(' ').join('') + '-' + new Date(match.date).getTime()).toLowerCase();
      Match.find({}, (err, matches) => {
        let existing = this.findExisting(psuedoKey, matches);

        if (existing) {
          var matching = existing._doc.MatchInstances.find(el => {
            return el._doc.Service === service;
          })
          if (typeof matching === 'undefined') {
            existing._doc.MatchInstances.push({
              PsuedoKey: psuedoKey,
              Service: service,
              Region: region,
              Team1: {
                Name: match.team1,
                Price: odds.selections[0].odd
              },
              Team2: {
                Name: match.team2,
                Price: odds.selections[2].odd
              },
              DrawPrice: odds.selections[1].odd
            })

            existing.markModified('MatchInstances');
            
            existing.save((err, updatedMatch) => {
              if (err) {
                console.log(err);
                reject();
              }
              resolve(updatedMatch);
            });
          }
        } else {
          new Match({
            PsuedoKey: psuedoKey,
            Sport: sport,
            League: league,
            Date: new Date(match.date).toISOString(),
            Team1: match.team1,
            Team2: match.team2,
            MatchInstances: [{
              PsuedoKey: psuedoKey,
              Service: service,
              Region: region,
              Team1: {
                Name: match.team1,
                Price: odds.selections[0].odd
              },
              Team2: {
                Name: match.team2,
                Price: odds.selections[2].odd
              },
              DrawPrice: odds.selections[1].odd
            }]
          }).save((err, newMatch) => {
            if (err) {
              console.log(err);
              reject();
            }
            resolve(newMatch);
          });
        }
      });
    })
  }

  scrapeBetPawaPremierLeague() {
    return this.startBetPawaScraper('2566', this.leagues.premierLeague);
  }

  scrapeBetPawaEFLCup() {
    return this.startBetPawaScraper('3461', this.leagues.eflCup);
  }

  scrapeBetPawaLaLiga() {
    return this.startBetPawaScraper('2599', this.leagues.laLiga);
  }

  scrapeBetPawaSerieA() {
    return this.startBetPawaScraper('2603', this.leagues.serieA);
  }

  scrapeBetPawaLigue1() {
    return this.startBetPawaScraper('2613', this.leagues.ligue1);
  }

  scrapeBetPawaBundesliga() {
    return this.startBetPawaScraper('2581', this.leagues.bundesliga);
  }

  startBetPawaScraper(leagueId, league) {
    return new Promise((resolve, reject) => {
      var options = {
        method: 'POST',
        uri: 'https://www.betpawa.co.ke/ws/public/pricing/getEventsForGroup',
        body: {
          MarketTypeGrouping: "_1X2",
          CategoryId: 2,
          GroupId: leagueId
        },
        json: true
      };

      rp(options)
        .then(res => {
          let resMatches = res.Data.Events;
          let matches = [];
          for (let match of resMatches) {
            matches.push(this.parseBetPawaJSONMatches(match, this.services.betPawa.name, this.services.betPawa.region, league));
          }
          Promise.all(matches)
            .then(data => {
              resolve();
            })
            .catch(err => {
              reject(err);
            });
        })
        .catch(err => {
            reject(err);
        });
      
    })
  }

  //parse BetPawa Matches
  parseBetPawaJSONMatches(match, service, region, league) {
    return new Promise((resolve, reject) => {
      let sport = "Soccer";
      let psuedoKey = (match.Name.split(' - ')[0].split(' ').join('') + '-' + match.Name.split(' - ')[1].split(' ').join('') + '-' + new Date(match.StartsRaw).getTime()).toLowerCase();
      Match.find({}, (err, matches) => {
        let existing = this.findExisting(psuedoKey, matches);

        if (existing) {
          var matching = existing._doc.MatchInstances.find(el => {
            return el._doc.Service === service;
          })
          if (typeof matching === 'undefined') {
            existing._doc.MatchInstances.push({
              PsuedoKey: psuedoKey,
              Service: service,
              Region: region,
              Team1: {
                Name: match.Name.split(' - ')[0],
                Price: match.Markets[0].Prices[0].Price
              },
              Team2: {
                Name: match.Name.split(' - ')[1],
                Price: match.Markets[0].Prices[2].Price
              },
              DrawPrice: match.Markets[0].Prices[1].Price
            })

            existing.markModified('MatchInstances');
            
            existing.save((err, updatedMatch) => {
              if (err) {
                console.log(err);
                reject();
              }
              resolve(updatedMatch);
            });
          }
        } else {
          new Match({
            PsuedoKey: psuedoKey,
            Sport: sport,
            League: league,
            Date: new Date(match.StartsRaw).toISOString(),
            Team1: match.Name.split(' - ')[0],
            Team2: match.Name.split(' - ')[1],
            MatchInstances: [{
              PsuedoKey: psuedoKey,
              Service: service,
              Region: region,
              Team1: {
                Name: match.Name.split(' - ')[0],
                Price: match.Markets[0].Prices[0].Price
              },
              Team2: {
                Name: match.Name.split(' - ')[1],
                Price: match.Markets[0].Prices[2].Price
              },
              DrawPrice: match.Markets[0].Prices[1].Price
            }]
          }).save((err, newMatch) => {
            if (err) {
              console.log(err);
              reject();
            }
            resolve(newMatch);
          });
        }
      });
    })
  }
  //ends of parseBetPawaJSONMatches

  //start crawling LovingBet Matches
  scrapeLovingBetPremierLeague() {
    return this.startLovingBetScraper('512', this.leagues.premierLeague);
  }

  scrapeLovingBetEFLCup() {
    return this.startLovingBetScraper('3436', this.leagues.eflCup);
  }

  scrapeLovingBetLaLiga() {
    return this.startLovingBetScraper('360', this.leagues.laLiga);
  }

  scrapeLovingBetSerieA() {
    return this.startLovingBetScraper('251', this.leagues.serieA);
  }

  scrapeLovingBetLigue1() {
    return this.startLovingBetScraper('374', this.leagues.ligue1);
  }

  scrapeLovingBetBundesliga() {
    return this.startLovingBetScraper('538', this.leagues.bundesliga);
  }

  //start of LovingBetScraper
  startLovingBetScraper(leagueId, league) {
    return new Promise((resolve, reject) => {
      var options = {
        method: 'GET',
        uri: 'https://www.lovingbet.com/Odds/bets/category/' + leagueId,
        transform: function (body) {
            return cheerio.load(body);
        }
      };

      rp(options)
        .then($ => {
          let matches = [];
          $('.category_bets_odd').each((ind, val) => {
            matches.push(this.parseLovingBetMatches($, val, this.services.lovingBet.name, this.services.lovingBet.region, league));
          })
          $('.category_bets_even').each((ind, val) => {
            matches.push(this.parseLovingBetMatches($, val, this.services.lovingBet.name, this.services.lovingBet.region, league));
          })
          Promise.all(matches)
            .then(data => {
              resolve();
            })
            .catch(err => {
              reject(err);
            });
        })
        .catch(err => {
            reject(err);
        });
      
    })
  }
  //ends of startLovingBetScraper

  //parsing LovingBetMatches
  parseLovingBetMatches($, val, service, region, league) {
    return new Promise((resolve, reject) => {
      let sport = "Soccer";
      let team1 = $(val).find('.bst_sell_ev_name')[0].children[0].data;
      let team2 = $(val).find('.bst_sell_ev_name')[1].children[0].data;
      let dateEl = $(val).find('.betsPage_eventStart')[0].children[0].children[0].data;
      let day = dateEl.split('Date: ')[1].split('.')[0];
      let month = dateEl.split('Date: ')[1].split('.')[1];
      let year = '20' + dateEl.split('Date: ')[1].split('.')[2].split(' ')[0];
      let time = dateEl.split('Date: ')[1].split('.')[2].split(' ')[1];
      let dateString = year + '-' + month + '-' + day + ' ' + time;
      let psuedoKey = (team1.split(' ').join('') + '-' + team2.split(' ').join('') + '-' + new Date(dateString).getTime()).toLowerCase();
      Match.find({}, (err, matches) => {
        let existing = this.findExisting(psuedoKey, matches);

        if (existing && existing._doc.League === league) {
          var matching = existing._doc.MatchInstances.find(el => {
            return el._doc.Service === service;
          })
          if (typeof matching === 'undefined') {
            existing._doc.MatchInstances.push({
              PsuedoKey: psuedoKey,
              Service: service,
              Region: region,
              Team1: {
                Name: team1,
                Price: $(val).find('.coo_p')[0].children[0].data
              },
              Team2: {
                Name: team2,
                Price: $(val).find('.coo_p')[2].children[0].data
              },
              DrawPrice: $(val).find('.coo_p')[1].children[0].data
            })

            existing.markModified('MatchInstances');
            
            existing.save((err, updatedMatch) => {
              if (err) {
                console.log(err);
                reject();
              }
              resolve(updatedMatch);
            });
          }
        } else {
          new Match({
            PsuedoKey: psuedoKey,
            Sport: sport,
            League: league,
            Date: new Date(dateString).toISOString(),
            Team1: team1,
            Team2: team2,
            MatchInstances: [{
              PsuedoKey: psuedoKey,
              Service: service,
              Region: region,
              Team1: {
                Name: team1,
                Price: $(val).find('.coo_p')[0].children[0].data
              },
              Team2: {
                Name: team2,
                Price: $(val).find('.coo_p')[2].children[0].data
              },
              DrawPrice: $(val).find('.coo_p')[1].children[0].data
            }]
          }).save((err, newMatch) => {
            if (err) {
              console.log(err);
              reject();
            }
            resolve(newMatch);
          });
        }
      })
    })
  }
//ends of parseLovingBetMatches
//ends of crawling LovingBet Matches
 
//start crawling SportPesa matches
  scrapeSportPesaPremierLeague() {
    return this.startSportPesaScraper('67600', this.leagues.premierLeague);
  }

  scrapeSportPesaEFLCup() {
    return this.startSportPesaScraper('76298', this.leagues.eflCup);
  }

  scrapeSportPesaLaLiga() {
    return this.startSportPesaScraper('76837', this.leagues.laLiga);
  }

  scrapeSportPesaSerieA() {
    return this.startSportPesaScraper('67358', this.leagues.serieA);
  }

  scrapeSportPesaLigue1() {
    return this.startLovingBetScraper('76062', this.leagues.ligue1);
  }

  scrapeSportPesaBundesliga() {
    return this.startSportPesaScraper('76390', this.leagues.bundesliga);
  }

  //start of SportPesaScraper
  startSportPesaScraper(leagueId, league) {
    return new Promise((resolve, reject) => {
      var options = {
        method: 'GET',
        uri: 'https://www.sportpesa.co.ke/leaguegames?league='+leagueId+'&sportId=1&top=1',
        transform: function (body) {
            return cheerio.load(body);
        }
      };

      rp(options)
        .then($ => {
          let matches = [];
          $('.match.FOOTBALL.-.Games.for.this.league').each((ind, val) => {
            matches.push(this.parseSportPesaMatches($, val, this.services.sportPesa.name, this.services.sportPesa.region, league));
          })
          Promise.all(matches)
            .then(data => {
              resolve();
            })
            .catch(err => {
              reject(err);
            });
        })
        .catch(err => {
            reject(err);
        });
      
    })
  }
  //ends of startSportPesaScraper

  //parsing SportPesaMatches
  parseSportPesaMatches($, val, service, region, league) {
    return new Promise((resolve, reject) => {
      let sport = "Soccer";
      let team1 = $(val).find('li.pick01 > a.betting-button.pick-button:nth-child(1) > span.team:nth-child(1)').text().trim();
      let team2 = $(val).find('li.pick02 > a.betting-button.pick-button:nth-child(1) > span.team:nth-child(1)').text().trim();
      let dateString = $(val).find('ul.meta:nth-child(2) > li.date:nth-child(1) > timecomponent:nth-child(1)').attr('datetime').replace(/["']/g, "");
      let psuedoKey = (team1.split(' ').join('') + '-' + team2.split(' ').join('') + '-' + new Date(dateString).getTime()).toLowerCase();
      // console.log("team1 =>"+team1);
      // console.log("team2 =>"+team2);
      // console.log("date =>"+dateString);
      // console.log("date ISO string =>"+new Date(dateString).toISOString());
      // console.log("pseudokey =>"+psuedoKey);

      Match.find({}, (err, matches) => {
        let existing = this.findExisting(psuedoKey, matches);

        if (existing && existing._doc.League === league) {
          var matching = existing._doc.MatchInstances.find(el => {
            return el._doc.Service === service;
          })
          if (typeof matching === 'undefined') {
            existing._doc.MatchInstances.push({
              PsuedoKey: psuedoKey,
              Service: service,
              Region: region,
              Team1: {
                Name: team1,
                Price: $(val).find('li.pick01 > a.betting-button.pick-button:nth-child(1) > span.odd:nth-child(2)').text()
              },
              Team2: {
                Name: team2,
                Price: $(val).find('li.pick02 > a.betting-button.pick-button:nth-child(1) > span.odd:nth-child(2)').text()
              },
              DrawPrice: $(val).find('li.pick0X > a.betting-button.pick-button:nth-child(1) > span.odd:nth-child(2)').text()
            })

            existing.markModified('MatchInstances');
            
            existing.save((err, updatedMatch) => {
              if (err) {
                console.log(err);
                reject();
              }
              resolve(updatedMatch);
            });
          }
        } else {
          new Match({
            PsuedoKey: psuedoKey,
            Sport: sport,
            League: league,
            Date: new Date(dateString).toISOString(),
            Team1: team1,
            Team2: team2,
            MatchInstances: [{
              PsuedoKey: psuedoKey,
              Service: service,
              Region: region,
              Team1: {
                Name: team1,
                Price: $(val).find('li.pick01 > a.betting-button.pick-button:nth-child(1) > span.odd:nth-child(2)').text()
              },
              Team2: {
                Name: team2,
                Price: $(val).find('li.pick02 > a.betting-button.pick-button:nth-child(1) > span.odd:nth-child(2)').text()
              },
              DrawPrice: $(val).find('li.pick0X > a.betting-button.pick-button:nth-child(1) > span.odd:nth-child(2)').text()
            }]
          }).save((err, newMatch) => {
            if (err) {
              console.log(err);
              reject();
            }
            resolve(newMatch);
          });
        }
      })
    })
  }
//ends of parseSportPesaMatches
//ends of crawling SportPesa Matches

//start crawling BetIn matches
scrapeBetInPremierLeague() {
  return this.startBetInScraper('371', this.leagues.premierLeague);
}

scrapeBetInEFLCup() {
  return this.startBetInScraper('102636', this.leagues.eflCup);
}

scrapeBetInLaLiga() {
  return this.startBetInScraper('413', this.leagues.laLiga);
}

scrapeBetInSerieA() {
  return this.startBetInScraper('67358', this.leagues.serieA);
}

scrapeBetInLigue1() {
  return this.startBetInScraper('376', this.leagues.ligue1);
}

scrapeBetInBundesliga() {
  return this.startBetInScraper('381', this.leagues.bundesliga);
}

//start of BetInScraper
startBetInScraper(leagueId, league) {
  return new Promise((resolve, reject) => {
    var options = {
      method: 'GET',
      uri: 'https://web.betin.co.ke/Controls/OddsEventExt.aspx?showDate=1&showGQ=1&EventID='+leagueId,
      transform: function (body) {
          return cheerio.load(body);
      }
    };

    rp(options)
      .then($ => {
        let matches = [];
        let x =1;
        $('.item').each((ind, val) => {
          matches.push(this.parseBetInMatches($, val, this.services.betIn.name, this.services.betIn.region, league));
        })
        Promise.all(matches)
          .then(data => {
            resolve();
          })
          .catch(err => {
            reject(err);
          });
      })
      .catch(err => {
          reject(err);
      });
    
  })
}
//ends of startBetInScraper

//parsing BetInMatches
parseBetInMatches($, val, service, region, league) {
  return new Promise((resolve, reject) => {
    let sport = "Soccer";
    let team1 = $(val).find('div.Event:nth-child(4)').text().split("-")[0].trim();
    let team2 = $(val).find('div.Event:nth-child(4)').text().split("-")[1].trim();
    let mtime  = $(val).find('div.Time:nth-child(3) > span:nth-child(1)').text();
    let dateString = $(val).find('div.Time:nth-child(3) > span:nth-child(2)').text()+" "+new Date().getFullYear()+" "+mtime;
    let psuedoKey = (team1.split(' ').join('') + '-' + team2.split(' ').join('') + '-' + new Date(dateString).getTime()).toLowerCase();

    // console.log("team1 =>"+team1);
    // console.log("team2 =>"+team2);
    // console.log("Match time =>"+mtime);
    // console.log("date =>"+dateString);
    // console.log("date ISO string =>"+new Date(dateString).toISOString());
    // console.log("pseudokey =>"+psuedoKey);

    Match.find({}, (err, matches) => {
      let existing = this.findExisting(psuedoKey, matches);

      if (existing && existing._doc.League === league) {
        var matching = existing._doc.MatchInstances.find(el => {
          return el._doc.Service === service;
        })
        if (typeof matching === 'undefined') {
          existing._doc.MatchInstances.push({
            PsuedoKey: psuedoKey,
            Service: service,
            Region: region,
            Team1: {
              Name: team1,
              Price: $(val).find('div.odd.r1.c1.g1  > div:nth-child(2)').text()
            },
            Team2: {
              Name: team2,
              Price: $(val).find('div.odd.r1.c3.g1  > div:nth-child(2)').text()
            },
            DrawPrice: $(val).find('div.odd.r1.c2.g1  > div:nth-child(2)').text()
          })

          existing.markModified('MatchInstances');
          
          existing.save((err, updatedMatch) => {
            if (err) {
              console.log(err);
              reject();
            }
            resolve(updatedMatch);
          });
        }
      } else {
        new Match({
          PsuedoKey: psuedoKey,
          Sport: sport,
          League: league,
          Date: new Date(dateString).toISOString(),
          Team1: team1,
          Team2: team2,
          MatchInstances: [{
            PsuedoKey: psuedoKey,
            Service: service,
            Region: region,
            Team1: {
              Name: team1,
              Price: $(val).find('div.odd.r1.c1.g1  > div:nth-child(2)').text()
            },
            Team2: {
              Name: team2,
              Price: $(val).find('div.odd.r1.c3.g1  > div:nth-child(2)').text()
            },
            DrawPrice: $(val).find('div.odd.r1.c2.g1  > div:nth-child(2)').text()
          }]
        }).save((err, newMatch) => {
          if (err) {
            console.log(err);
            reject();
          }
          resolve(newMatch);
        });
      }
    })
  })
}
//ends of parseBetInMatches
//ends of crawling BetIn Matches

//start crawling Betika matches
scrapeBetikaPremierLeague() {
  return this.startBetikaScraper('222', this.leagues.premierLeague);
}

scrapeBetikaEFLCup() {
  return this.startBetikaScraper('8398', this.leagues.eflCup);
}

scrapeBetikaLaLiga() {
  return this.startBetikaScraper('14482', this.leagues.laLiga);
}

scrapeBetikaSerieA() {
  return this.startBetikaScraper('182', this.leagues.serieA);
}

scrapeBetikaLigue1() {
  return this.startBetikaScraper('209', this.leagues.ligue1);
}

scrapeBetikaBundesliga() {
  return this.startBetikaScraper('214', this.leagues.bundesliga);
}

//start of BetikaScraper
startBetikaScraper(leagueId, league) {
  return new Promise((resolve, reject) => {
    var options = {
      method: 'GET',
      uri: 'https://www.betika.com/competition?id='+leagueId,
      transform: function (body) {
          return cheerio.load(body);
      }
    };

    rp(options)
      .then($ => {
        let matches = [];
        let x =1;
        //remove mobile classes
        $('.col-sm-12.top-matches.mobi').remove();
        $('.col-sm-12.top-matches').each((ind, val) => {
          matches.push(this.parseBetikaMatches($, val, this.services.betika.name, this.services.betika.region, league));
        })
        Promise.all(matches)
          .then(data => {
            resolve();
          })
          .catch(err => {
            reject(err);
          });
      })
      .catch(err => {
          reject(err);
      });
    
  })
}
//ends of startBetikaScraper

//parsing BetikaMatches
parseBetikaMatches($, val, service, region, league) {
  return new Promise((resolve, reject) => {
    let sport = "Soccer";
    let team1 = $(val).find('div:nth-child(3) > button > span.theteam').text().trim();
    let team2 = $(val).find('div:nth-child(5) > button > span.theteam').text().trim();
    let mtime  = $(val).find('div:nth-child(1)').text().split(' ')[1];
    let mdate  = $(val).find('div:nth-child(1)').text().split(' ')[0];
    let dateString =mdate+"/"+new Date().getFullYear()+" "+mtime;
    let psuedoKey = (team1.split(' ').join('') + '-' + team2.split(' ').join('') + '-' + new Date(dateString).getTime()).toLowerCase();

    // console.log("team1 =>"+team1);
    // console.log("team2 =>"+team2);
    // console.log("Match time =>"+mtime);
    // console.log("date =>"+dateString);
    // console.log("date ISO string =>"+new Date(dateString).toISOString());
    // console.log("pseudokey =>"+psuedoKey);

    Match.find({}, (err, matches) => {
      let existing = this.findExisting(psuedoKey, matches);

      if (existing && existing._doc.League === league) {
        var matching = existing._doc.MatchInstances.find(el => {
          return el._doc.Service === service;
        })
        if (typeof matching === 'undefined') {
          existing._doc.MatchInstances.push({
            PsuedoKey: psuedoKey,
            Service: service,
            Region: region,
            Team1: {
              Name: team1,
              Price: $(val).find('div:nth-child(3) > button > span.theodds').text()
            },
            Team2: {
              Name: team2,
              Price: $(val).find('div:nth-child(5)> button > span.theodds').text()
            },
            DrawPrice: $(val).find('div:nth-child(4) > button > span').text()
          })

          existing.markModified('MatchInstances');
          
          existing.save((err, updatedMatch) => {
            if (err) {
              console.log(err);
              reject();
            }
            resolve(updatedMatch);
          });
        }
      } else {
        new Match({
          PsuedoKey: psuedoKey,
          Sport: sport,
          League: league,
          Date: new Date(dateString).toISOString(),
          Team1: team1,
          Team2: team2,
          MatchInstances: [{
            PsuedoKey: psuedoKey,
            Service: service,
            Region: region,
            Team1: {
              Name: team1,
              Price: $(val).find('div:nth-child(3) > button > span.theodds').text()
            },
            Team2: {
              Name: team2,
              Price: $(val).find('div:nth-child(5)> button > span.theodds').text()
            },
            DrawPrice: $(val).find('div:nth-child(4) > button > span').text()
          }]
        }).save((err, newMatch) => {
          if (err) {
            console.log(err);
            reject();
          }
          resolve(newMatch);
        });
      }
    })
  })
}
//ends of parseBetikaMatches
//ends of crawling Betika Matches
//start crawling 1xBet matches
scrape1xBetPremierLeague() {
  return this.start1xBetScraper('88637', this.leagues.premierLeague);
}

scrape1xBetEFLCup() {
  return this.start1xBetScraper('119237', this.leagues.eflCup);
}

scrape1xBetLaLiga() {
  return this.start1xBetScraper('127733', this.leagues.laLiga);
}

scrape1xBetSerieA() {
  return this.start1xBetScraper('110163', this.leagues.serieA);
}

scrape1xBetLigue1() {
  return this.start1xBetScraper('12821', this.leagues.ligue1);
}

scrape1xBetBundesliga() {
  return this.start1xBetScraper('96463', this.leagues.bundesliga);
}

//start of 1xBetScraper
start1xBetScraper(leagueId, league) {
  return new Promise((resolve, reject) => {
    var options = {
      method: 'GET',
      uri: 'https://1xbet.com/LineFeed/Get1x2_Zip?champs='+leagueId+'&sports=1&count=150&lng=en&mode=4&getEmpty=true',
      json: true
    };

    rp(options)
    .then(res => {
      let matches = [];
      for (let match of res.Value) {
        if(typeof match.DI === 'undefined'){
           matches.push(this.parse1xBetJSONMatches(match, this.services.x1bet.name, this.services.x1bet.region, league));
        }
      }
      Promise.all(matches)
        .then(data => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    })
    .catch(err => {
        reject(err);
    });
    
  })
}
//ends of start1xBetScraper

  //parse 1xBet Matches
  parse1xBetJSONMatches(match, service, region, league) {
    return new Promise((resolve, reject) => {
      let sport = "Soccer";
      let psuedoKey = (match.O1.split(' ').join('') + '-' + match.O2.split(' ').join('') + '-' + new Date(match.S*1000).getTime()).toLowerCase();

      Match.find({}, (err, matches) => {
        let existing = this.findExisting(psuedoKey, matches);

        if (existing) {
          var matching = existing._doc.MatchInstances.find(el => {
            return el._doc.Service === service;
          })
          if (typeof matching === 'undefined') {
            existing._doc.MatchInstances.push({
              PsuedoKey: psuedoKey,
              Service: service,
              Region: region,
              Team1: {
                Name: match.O1,
                Price: match.E[0].C
              },
              Team2: {
                Name: match.O2,
                Price: match.E[2].C
              },
              DrawPrice: match.E[1].C
            })

            existing.markModified('MatchInstances');
            
            existing.save((err, updatedMatch) => {
              if (err) {
                console.log(err);
                reject();
              }
              resolve(updatedMatch);
            });
          }
        } else {
          new Match({
            PsuedoKey: psuedoKey,
            Sport: sport,
            League: league,
            Date: new Date(match.S*1000).toISOString(),
            Team1: match.O1,
            Team2: match.O2,
            MatchInstances: [{
              PsuedoKey: psuedoKey,
              Service: service,
              Region: region,
              Team1: {
                Name: match.O1,
                Price: match.E[0].C
              },
              Team2: {
                Name: match.O2,
                Price: match.E[2].C
              },
              DrawPrice: match.E[1].C
            }]
          }).save((err, newMatch) => {
            if (err) {
              console.log(err);
              reject();
            }
            resolve(newMatch);
          });
        }
      });
    })
  }
  //ends of parse1xBetJSONMatches
//ends of crawling 1xBet Matches
//finds if matches exists
  findExisting(psuedoKey, matches) {
    if (matches.length < 1) {
      return null;
    }

    let mostSimilar = matches[0];

    let keyp1 = psuedoKey.split('-')[0];
    let keyp2 = psuedoKey.split('-')[1];
    let keyDate = psuedoKey.split('-')[2];

    for (let match of matches) {
      let matchKeyp1 = match._doc.PsuedoKey.split('-')[0];
      let matchKeyp2 = match._doc.PsuedoKey.split('-')[1];
      let matchKeyDate = match._doc.PsuedoKey.split('-')[2];
      let combinedSimilarity = this.similarity(keyp1, matchKeyp1) + this.similarity(keyp2, matchKeyp2);
      
      let mostMatchKeyp1 = mostSimilar._doc.PsuedoKey.split('-')[0];
      let mostMatchKeyp2 = mostSimilar._doc.PsuedoKey.split('-')[1];
      let mostMatchKeyDate = mostSimilar._doc.PsuedoKey.split('-')[2];
      let mostCombinedSimilarity = this.similarity(keyp1, mostMatchKeyp1) + this.similarity(keyp2, mostMatchKeyp2);

      let within24Hours = false;
      let daydiff = Math.abs(parseInt(keyDate) - parseInt(matchKeyDate)) / 86400000;
      if (daydiff < 1) {
        within24Hours = true;
      }

      if (combinedSimilarity > mostCombinedSimilarity && combinedSimilarity > .8 && within24Hours) {
        mostSimilar = match;
      }

    }

    return this.similarity(keyp1, mostSimilar._doc.PsuedoKey.split('-')[0]) > .4 &&
           this.similarity(keyp2, mostSimilar._doc.PsuedoKey.split('-')[1]) > .4 &&
           Math.abs(parseInt(keyDate) - parseInt(mostSimilar._doc.PsuedoKey.split('-')[2])) / 86400000 < 1 ? 
           mostSimilar : null;
  }
  //ends of findExisting matches

  //edit distance
  editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
      var lastValue = i;
      for (var j = 0; j <= s2.length; j++) {
        if (i == 0)
          costs[j] = j;
        else {
          if (j > 0) {
            var newValue = costs[j - 1];
            if (s1.charAt(i - 1) != s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue),
                costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0)
        costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }
  //ends of editDistance

  // similarity
  similarity(s1, s2) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
      return 1.0;
    }
    return (longerLength - this.editDistance(longer, shorter)) / parseFloat(longerLength);
  }
  //ends of similarity

}
//ends of OddsFinderScraper class

// crawling routes starts

router.get('/startBetway', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetwayPremierLeague()
  oddsFinderScraper.scrapeBetwayEFLCup()
  oddsFinderScraper.scrapeBetwayLaLiga()
  oddsFinderScraper.scrapeBetwaySerieA()
  oddsFinderScraper.scrapeBetwayLigue1(),
  oddsFinderScraper.scrapeBetwayBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetwayPremierLeague', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetwayPremierLeague()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetwayEFLCup', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetwayEFLCup()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetwayLaLiga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetwayLaLiga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetwayLigue1', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetwayLigue1()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetwaySerieA', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetwaySerieA()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetwayBundesliga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetwayBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startMerryBet', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeMerryBetPremierLeague()
  oddsFinderScraper.scrapeMerryBetEFLCup()
  oddsFinderScraper.scrapeMerryBetLaLiga()
  oddsFinderScraper.scrapeMerryBetSerieA()
  oddsFinderScraper.scrapeMerryBetLigue1(),
  oddsFinderScraper.scrapeMerryBetBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startMerryBetPremierLeague', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeMerryBetPremierLeague()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startMerryBetEFLCup', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeMerryBetEFLCup()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startMerryBetLaLiga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeMerryBetLaLiga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startMerryBetLigue1', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeMerryBetLigue1()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startMerryBetSerieA', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeMerryBetSerieA()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startMerryBetBundesliga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeMerryBetBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startPrincessBet', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapePrincessBetPremierLeague()
  oddsFinderScraper.scrapePrincessBetEFLCup()
  oddsFinderScraper.scrapePrincessBetLaLiga()
  oddsFinderScraper.scrapePrincessBetSerieA()
  oddsFinderScraper.scrapePrincessBetLigue1(),
  oddsFinderScraper.scrapePrincessBetBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startPrincessBetPremierLeague', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapePrincessBetPremierLeague()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startPrincessBetEFLCup', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapePrincessBetEFLCup()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startPrincessBetLaLiga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapePrincessBetLaLiga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startPrincessBetLigue1', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapePrincessBetLigue1()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startPrincessBetSerieA', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapePrincessBetSerieA()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startPrincessBetBundesliga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapePrincessBetBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetPawa', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetPawaPremierLeague()
  oddsFinderScraper.scrapeBetPawaEFLCup()
  oddsFinderScraper.scrapeBetPawaLaLiga()
  oddsFinderScraper.scrapeBetPawaSerieA()
  oddsFinderScraper.scrapeBetPawaLigue1(),
  oddsFinderScraper.scrapeBetPawaBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetPawaPremierLeague', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetPawaPremierLeague()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetPawaEFLCup', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetPawaEFLCup()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetPawaLaLiga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetPawaLaLiga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetPawaLigue1', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetPawaLigue1()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetPawaSerieA', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetPawaSerieA()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetPawaBundesliga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetPawaBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startLovingBet', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeLovingBetPremierLeague()
  oddsFinderScraper.scrapeLovingBetEFLCup()
  oddsFinderScraper.scrapeLovingBetLaLiga()
  oddsFinderScraper.scrapeLovingBetSerieA()
  oddsFinderScraper.scrapeLovingBetLigue1(),
  oddsFinderScraper.scrapeLovingBetBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startLovingBetPremierLeague', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeLovingBetPremierLeague()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startLovingBetEFLCup', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeLovingBetEFLCup()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startLovingBetLaLiga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeLovingBetLaLiga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startLovingBetLigue1', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeLovingBetLigue1()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startLovingBetSerieA', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeLovingBetSerieA()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startLovingBetBundesliga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeLovingBetBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})
//SportPesa routes
router.get('/startSportPesa', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeSportPesaPremierLeague()
  oddsFinderScraper.scrapeSportPesaEFLCup()
  oddsFinderScraper.scrapeSportPesaLaLiga()
  oddsFinderScraper.scrapeSportPesaSerieA()
  oddsFinderScraper.scrapeSportPesaLigue1(),
  oddsFinderScraper.scrapeSportPesaBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startSportPesaPremierLeague', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeSportPesaPremierLeague()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startSportPesaEFLCup', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeSportPesaEFLCup()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startSportPesaLaLiga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeSportPesaLaLiga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startSportPesaLigue1', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeSportPesaLigue1()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startSportPesaSerieA', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeSportPesaSerieA()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})


router.get('/startSportPesaBundesliga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeSportPesaBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})
//BetIn routes
router.get('/startBetIn', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetInPremierLeague()
  oddsFinderScraper.scrapeBetInEFLCup()
  oddsFinderScraper.scrapeBetInLaLiga()
  oddsFinderScraper.scrapeBetInSerieA()
  oddsFinderScraper.scrapeBetInLigue1(),
  oddsFinderScraper.scrapeBetInBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetInPremierLeague', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetInPremierLeague()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetInEFLCup', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetInEFLCup()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetInLaLiga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetInLaLiga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetInLigue1', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetInLigue1()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetInSerieA', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetInSerieA()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})


router.get('/startBetInBundesliga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetInBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

//Betika routes
router.get('/startBetika', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetikaPremierLeague()
  oddsFinderScraper.scrapeBetikaEFLCup()
  oddsFinderScraper.scrapeBetikaLaLiga()
  oddsFinderScraper.scrapeBetikaSerieA()
  oddsFinderScraper.scrapeBetikaLigue1(),
  oddsFinderScraper.scrapeBetikaBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetikaPremierLeague', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetikaPremierLeague()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetikaEFLCup', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetikaEFLCup()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetikaLaLiga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetikaLaLiga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetikaLigue1', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetikaLigue1()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/startBetikaSerieA', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetikaSerieA()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})


router.get('/startBetikaBundesliga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrapeBetikaBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

//1xBet routes
router.get('/start1xBet', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrape1xBetPremierLeague()
  oddsFinderScraper.scrape1xBetEFLCup()
  oddsFinderScraper.scrape1xBetLaLiga()
  oddsFinderScraper.scrape1xBetSerieA()
  oddsFinderScraper.scrape1xBetLigue1(),
  oddsFinderScraper.scrape1xBetBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/start1xBetPremierLeague', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrape1xBetPremierLeague()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/start1xBetEFLCup', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrape1xBetEFLCup()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/start1xBetLaLiga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrape1xBetLaLiga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/start1xBetLigue1', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrape1xBetLigue1()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})

router.get('/start1xBetSerieA', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrape1xBetSerieA()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})


router.get('/start1xBetBundesliga', function(req, res) {
  oddsFinderScraper = new OddsFinderScraper();
  oddsFinderScraper.scrape1xBetBundesliga()
    .then(() => {
      res.json('{ success : true }');
    })
    .catch((err) => {
      res.json('{ success : false }');
    })
})
//ends of crawling routes

module.exports = router;