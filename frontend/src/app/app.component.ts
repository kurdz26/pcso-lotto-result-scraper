import { Component, OnInit } from '@angular/core';
import { ScraperService } from './services/scraper.service';
import { Chart, registerables } from 'chart.js';
import { OptionModel } from './model/option.model';
import { DrawnNumberModel } from './model/drawn-number.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [ScraperService]
})
export class AppComponent implements OnInit {

  isLoading: boolean = false;

  gameCode: string = '';
  yearFromTo: string = '';
  topNumbers: string = '';
  drawCount: number = 0;

  gameOptions: Array<OptionModel> = [];
  numbers: Array<DrawnNumberModel> = [];

  chart: Chart | undefined;

  constructor(private scraperService: ScraperService) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.scraperService.games().subscribe(resp => {
      this.gameOptions = resp.games;
      this.yearFromTo = resp.yearFromTo;
    });
  }

  showChart(data: any) {
    this.chart = new Chart("canvas", {
      type: 'bar',
      data: {
          labels: data.labels,
          datasets: [{
              label: data.label,
              data: data.data,
              // backgroundColor: data.colors,
              // borderColor: data.colors,
              // borderWidth: 1
          }]
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  loadGame() {
    this.topNumbers = '';
    if (!!this.chart) {
      this.chart.destroy();
    }
    if (!this.gameCode) {
      return;
    }
    this.isLoading = true;
    this.scraperService.game(this.gameCode).subscribe(resp => {
      this.isLoading = false;
      this.numbers = resp.numbers;
      const processedData = this.scraperService.processForNumberFrequency(this.gameCode, this.numbers);
      this.showChart(processedData);
      this.topNumbers = processedData.topDrawn.join('-');
      this.drawCount = processedData.topDrawn.length;
      this.scraperService.processForCombinationFrequency(this.numbers);
    });
  }

}
