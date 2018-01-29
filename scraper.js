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
}

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


module.exports = router;