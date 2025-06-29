import { notebookData } from './data-notebook.js';
import * as dom from './dom.js';

let questData = {};
let activeQuestId = null;
let activeTab = 'scheduled'; // 'scheduled' or 'completed'

/**
 * Loads quest progress and Bomber's Code from local storage.
 */
function loadProgress() {
    const savedProgress = localStorage.getItem('bombersNotebookProgress_v3');
    if (savedProgress) {
        questData = JSON.parse(savedProgress);
    } else {
        questData = JSON.parse(JSON.stringify(notebookData)); // Deep copy
    }
    // Ensure all quests have a completed property
    for (const category in questData) {
        questData[category].quests.forEach(quest => {
            if (quest.completed === undefined) {
                quest.completed = quest.steps.every(s => s.completed);
            }
        });
    }

    const savedCode = localStorage.getItem('bomberCode');
    if (savedCode) {
        dom.bomberCodeInput.value = savedCode;
    }
}

/**
 * Saves quest progress and Bomber's Code to local storage.
 */
function saveProgress() {
    localStorage.setItem('bombersNotebookProgress_v3', JSON.stringify(questData));
    localStorage.setItem('bomberCode', dom.bomberCodeInput.value);
}

/**
 * Renders the list of quests based on the active tab.
 */
function renderQuestList() {
    const container = dom.questListContainer;
    if (!container) return;
    container.innerHTML = '';

    for (const categoryKey in questData) {
        const category = questData[categoryKey];
        const questsToShow = category.quests.filter(q => 
            activeTab === 'completed' ? q.completed : !q.completed
        );

        if (questsToShow.length > 0) {
            const categoryTitle = document.createElement('h3');
            categoryTitle.className = 'quest-category-title';
            categoryTitle.textContent = category.title;
            container.appendChild(categoryTitle);

            questsToShow.forEach(quest => {
                const questItem = document.createElement('div');
                questItem.className = 'quest-list-item';
                questItem.innerHTML = `<span class="quest-name">${quest.name}</span>`;
                questItem.dataset.questId = quest.id;

                if (quest.id === activeQuestId) questItem.classList.add('active');
                if (quest.completed) questItem.classList.add('completed');

                questItem.addEventListener('click', () => {
                    activeQuestId = quest.id;
                    renderApp();
                });
                container.appendChild(questItem);
            });
        }
    }
}

/**
 * Renders the detailed view for the currently active quest.
 */
function renderQuestDetail() {
    if (!activeQuestId) {
        dom.notebookPlaceholderView.classList.remove('hidden');
        dom.questDetailView.classList.add('hidden');
        return;
    }

    const quest = Object.values(questData).flatMap(c => c.quests).find(q => q.id === activeQuestId);
    if (!quest) return;

    dom.notebookPlaceholderView.classList.add('hidden');
    dom.questDetailView.classList.remove('hidden');

    dom.questTitle.textContent = quest.name;
    dom.questRegion.textContent = quest.region;

    const stepsContainer = dom.questStepsList;
    stepsContainer.innerHTML = '';
    quest.steps.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'quest-step';
        if (step.completed) stepEl.classList.add('completed');
        stepEl.innerHTML = `<div class="checkbox"></div><p>${step.description}</p>`;
        stepEl.addEventListener('click', () => {
            step.completed = !step.completed;
            quest.completed = quest.steps.every(s => s.completed);
            saveProgress();
            renderApp();
        });
        stepsContainer.appendChild(stepEl);
    });

    const rewardsContainer = dom.questRewardsList;
    rewardsContainer.innerHTML = '';
    quest.rewards.forEach(rewardText => {
        const rewardEl = document.createElement('div');
        rewardEl.className = 'reward-item';
        let icon = '';
        if (rewardText.toLowerCase().includes('mask')) icon = 'images/masks_icon.png';
        else if (rewardText.toLowerCase().includes('heart')) icon = 'images/heart_container_icon.png';
        else if (rewardText.toLowerCase().includes('song')) icon = 'images/songs_icon.png';
        
        rewardEl.innerHTML = icon ? `<img src="${icon}" alt="reward">` : '';
        rewardEl.innerHTML += `<span>${rewardText}</span>`;
        rewardsContainer.appendChild(rewardEl);
    });
}

/**
 * Main render function for the notebook.
 */
function renderApp() {
    renderQuestList();
    renderQuestDetail();
}

/**
 * Initializes the Bomber's Notebook view and its event listeners.
 */
export function populateBombersNotebook() {
    loadProgress();
    renderApp();

    dom.bomberCodeInput.addEventListener('input', saveProgress);

    const tabs = document.querySelectorAll('.notebook-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            activeTab = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeQuestId = null; 
            renderApp();
        });
    });
}