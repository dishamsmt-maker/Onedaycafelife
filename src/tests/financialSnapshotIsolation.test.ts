import { describe, expect, it } from 'vitest';
import { act, createGame } from '../game/engine';

describe('ledger and report snapshot isolation', () => {
  it('does not mutate earlier financial, closing, review, or notice snapshots', () => {
    const before = createGame(20261104);
    before.ledger.push({ id:'tx-test',day:1,minute:420,type:'food-sale',amount:45,cashDelta:45,note:'test' });
    before.reviews.push({ id:'review-test',day:1,name:'Guest',stars:5,text:'Good',reason:'service',wait:1 });
    before.notices.push({ id:'notice-test',text:'Ready',minute:420 });
    before.reports.push({
      day:1,weather:'sunny',customers:1,completed:1,cancelled:0,
      foodRevenue:45,drinkRevenue:0,revenue:45,cogs:10,spoilage:0,
      wages:0,operating:0,profit:35,openingCash:100,closingCash:145,
      cashFlow:45,satisfaction:5,averageWait:1,shortages:['chicken'],inspection:'ok',
    });
    const after = act(before, { type:'pause' });
    after.ledger[0].amount = 999;
    after.reviews[0].stars = 1;
    after.notices[0].text = 'Changed';
    after.reports[0].shortages.push('milk');
    after.reports[0].revenue = 999;
    expect(before.ledger[0].amount).toBe(45);
    expect(before.reviews[0].stars).toBe(5);
    expect(before.notices[0].text).toBe('Ready');
    expect(before.reports[0].shortages).toEqual(['chicken']);
    expect(before.reports[0].revenue).toBe(45);
  });
});
