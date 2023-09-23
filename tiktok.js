// ==UserScript==
// @name         TikTok Video Info Extractor
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Extract video titles and views from TikTok user profiles and display in a sortable table and hashtag analytics.
// @author       You
// @match        https://www.tiktok.com/@*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function extractVideoInfo() {
        let containerDivs = document.querySelectorAll('div.tiktok-x6y88p-DivItemContainerV2');

        let infoDiv = document.createElement('div');
        infoDiv.style.position = 'fixed';
        infoDiv.style.top = '10px';
        infoDiv.style.right = '10px';
        infoDiv.style.zIndex = '1000';
        infoDiv.style.maxHeight = '400px';
        infoDiv.style.overflowY = 'scroll';
        infoDiv.style.padding = '10px';
        infoDiv.style.background = '#F0F0F0'; // Light gray background
        infoDiv.style.border = '1px solid black';
        infoDiv.style.boxShadow = '0px 0px 10px 0px rgba(0,0,0,0.75)';

        let table = document.createElement('table');
        table.style.width = '900px';
        table.style.borderCollapse = 'collapse';

        let thead = document.createElement('thead');
        let tr = document.createElement('tr');

        let th1 = document.createElement('th');
        th1.textContent = 'Views';
        th1.style.border = '1px solid black';
        th1.style.cursor = 'pointer';
        th1.dataset.order = 'desc';
        th1.onclick = function() {
            sortTable(table, th1.dataset.order);
            th1.dataset.order = th1.dataset.order === 'asc' ? 'desc' : 'asc';
        };

        let th2 = document.createElement('th');
        th2.textContent = 'Title';
        th2.style.border = '1px solid black';

        let th3 = document.createElement('th');
        th3.textContent = 'Hashtags';
        th3.style.border = '1px solid black';

        tr.appendChild(th1);
        tr.appendChild(th2);
        tr.appendChild(th3);
        thead.appendChild(tr);
        table.appendChild(thead);

        let tbody = document.createElement('tbody');
        table.appendChild(tbody);

        let hashtagDiv = document.createElement('div');
        hashtagDiv.style.padding = '10px';
        hashtagDiv.style.borderBottom = '1px solid black';
        hashtagDiv.style.marginBottom = '10px';

        let hashtagCounts = {};

        containerDivs.forEach(containerDiv => {
            let titleElement = containerDiv.querySelector('a.tiktok-1wrhn5c-AMetaCaptionLine');
            let title = titleElement ? titleElement.title : 'N/A';

            let viewsElement = containerDiv.querySelector('strong[data-e2e="video-views"]');
            let originalViews = viewsElement ? viewsElement.textContent.trim() : '0';
            let parsedViews = parseViews(originalViews);

            let hashtags = title.match(/#\w+/g) || [];

            hashtags.forEach(hashtag => {
                hashtagCounts[hashtag] = (hashtagCounts[hashtag] || {count: 0, views: 0});
                hashtagCounts[hashtag].count += 1;
                hashtagCounts[hashtag].views += parsedViews;
            });

            let tr = document.createElement('tr');
            let td1 = document.createElement('td');
            td1.textContent = originalViews;
            td1.style.border = '1px solid black';
            td1.dataset.parsedViews = parsedViews;

            let td2 = document.createElement('td');
            td2.textContent = title;
            td2.style.border = '1px solid black';

            let td3 = document.createElement('td');
            td3.textContent = hashtags.join(' ');
            td3.style.border = '1px solid black';

            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tbody.appendChild(tr);
        });

        Object.entries(hashtagCounts)
            .filter(([_, data]) => data.count > 1)
            .sort((a, b) => b[1].views - a[1].views)
            .forEach(([hashtag, data]) => {
                let p = document.createElement('p');
                let avgViews = (data.views / data.count).toFixed(2);
                p.textContent = `${hashtag}: ${data.count} times, ${data.views} views, Avg: ${avgViews} views/hashtag`;
                hashtagDiv.appendChild(p);
            });

        let dropdown = document.createElement('select');
        dropdown.style.marginBottom = '10px';
        dropdown.onchange = function() {
            table.style.display = this.value === 'table' ? 'block' : 'none';
            hashtagDiv.style.display = this.value === 'hashtags' ? 'block' : 'none';
        };

        let option1 = document.createElement('option');
        option1.textContent = 'Select Section';
        option1.value = 'select';
        dropdown.appendChild(option1);

        let option2 = document.createElement('option');
        option2.textContent = 'Video Table';
        option2.value = 'table';
        dropdown.appendChild(option2);

        let option3 = document.createElement('option');
        option3.textContent = 'Hashtags';
        option3.value = 'hashtags';
        dropdown.appendChild(option3);

        table.style.display = 'none';
        hashtagDiv.style.display = 'none';

        infoDiv.appendChild(dropdown);
        infoDiv.appendChild(hashtagDiv);
        infoDiv.appendChild(table);

        let closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '0';
        closeButton.style.right = '0';
        closeButton.style.background = 'red';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.cursor = 'pointer';

        closeButton.onclick = function() {
            document.body.removeChild(infoDiv);
        };

        infoDiv.appendChild(closeButton);
        document.body.appendChild(infoDiv);
    }

    function createButton() {
        let button = document.createElement('button');
        button.textContent = 'Extract Video Info';
        button.style.position = 'fixed';
        button.style.top = '100px';
        button.style.right = '10px';
        button.style.zIndex = '1000';
        button.style.padding = '10px';
        button.style.background = 'blue';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.cursor = 'pointer';

        button.onclick = extractVideoInfo;
        document.body.appendChild(button);
    }

    function parseViews(views) {
        let multiplier = views.includes('K') ? 1000 : views.includes('M') ? 1000000 : 1;
        return parseFloat(views.replace('K', '').replace('M', '')) * multiplier;
    }

    function sortTable(table, order) {
        let tbody = table.querySelector('tbody');
        let rows = Array.from(tbody.rows);
        if (order === 'asc') {
            rows.sort((a, b) => parseFloat(a.cells[0].dataset.parsedViews) - parseFloat(b.cells[0].dataset.parsedViews));
        } else {
            rows.sort((a, b) => parseFloat(b.cells[0].dataset.parsedViews) - parseFloat(a.cells[0].dataset.parsedViews));
        }
        rows.forEach(row => tbody.appendChild(row));
    }

    createButton();
})();
