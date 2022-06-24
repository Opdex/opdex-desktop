import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'opdex-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  // Todo: Watch each new block on timer or signalR
  // Todo: Index primary data periodically
  // --- OnInit - if indexing, show loader

  ngOnInit(): void {

  }
}
