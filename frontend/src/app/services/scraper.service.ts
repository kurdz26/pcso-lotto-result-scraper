import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DrawnNumberModel } from '../model/drawn-number.model';
import { toString } from 'lodash-es';

@Injectable({
  providedIn: 'root'
})
export class ScraperService {

  readonly url = 'http://localhost:8080';
  readonly endpoint = `${this.url}/scrapper/v1`;

  constructor(private http: HttpClient) { }

  games(): Observable<any> {
    return this.http.get(`${this.endpoint}/games`);
  }

  game(gameCode: string): Observable<any> {
    return this.http.get(`${this.endpoint}/game/${gameCode}`);
  }

  processForNumberFrequency(gameCode: string, data: Array<DrawnNumberModel>) {
    const numberCountMap: any = {};

    data.filter(d => !d.numbers?.includes(NaN) && !d.numbers?.every(e => !e)).forEach(e => {
      e.numbers?.forEach(f => {
        const keyList = Object.keys(numberCountMap);
        if (keyList.length === 0 || !keyList.includes(toString(f))) {
          numberCountMap[toString(f)] = 1;
        } else {
          numberCountMap[toString(f)]++;
        }
      });
    });

    const keyList = Object.keys(numberCountMap);
    const labels: string[] = [];
    const frequencies: any[] = [];
    const colors: any[] = [];
    const topDrawn: any[] = [];
    let drawCount = this.getDrawCount(gameCode);

    keyList.forEach(e => {
      let pickedColor = null;
      do {
        pickedColor = this.getRandomColor();
      } while(colors.includes(pickedColor) || pickedColor === null);


      if (topDrawn.length < drawCount) {
        topDrawn.push(e);
      } else {
        const idx = topDrawn.findIndex(n => numberCountMap[n] < numberCountMap[e]);
        if (idx >= 0) {
          topDrawn[idx] = e;
        }
      }

      colors.push(pickedColor);
      labels.push(e);
      frequencies.push(numberCountMap[e]);
    });
    return {
      labels: labels,
      label: '# of Frequency',
      data: frequencies,
      colors,
      topDrawn
    };
  }

  processForCombinationFrequency(data: Array<DrawnNumberModel>) {
    const combiCountMap: any = {};

    data.filter(d => !d.numbers?.includes(NaN)).forEach(e => {
      const numCombi = e.numbers?.join('-');
      const keyList = Object.keys(combiCountMap);
      if (keyList.length === 0 || !keyList.includes(toString(numCombi))) {
        combiCountMap[toString(numCombi)] = {
          count: 1,
          dates: [e.drawDt]
        };
      } else {
        if (!combiCountMap[toString(numCombi)].dates.includes(e.drawDt)) {
          combiCountMap[toString(numCombi)].count++;
          combiCountMap[toString(numCombi)].dates.push(e.drawDt);
        }
      }
    });

    const keyList = Object.keys(combiCountMap);
    keyList.forEach(e => { if (combiCountMap[e].count === 1) { delete combiCountMap[e]; } });
    return combiCountMap;
  }

  private getDrawCount(gameCode: string) {
    const sixD = ['18','17','1','2','13','5'];
    const fourD = '6';
    const threeD = ['8','9','10'];
    const twoD = ['15','16','11'];

    if (sixD.includes(gameCode)) return 6;
    if (fourD.includes(gameCode)) return 4;
    if (threeD.includes(gameCode)) return 3;
    if (twoD.includes(gameCode)) return 2;
    
    return 0;
  }

  private getRandomColor() {
    let color = '#';
    const letters = '0123456789ABCDEF';

    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }

    return color;
  }
}
