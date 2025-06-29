import * as dom from './dom.js';
import { showSongGridWithAnimation } from './song-view.js';
import { playNavOpenSound, playNavCloseSound, setVolume, toggleMute } from './audio.js';

let hideUiTimeout;
let activeContent = null;
let isNavOpen = false;
let isSettingsMenuOpen = false;
let exploreInterval = null;

/**
 * Provides the current state of the navigation pill.
 * @returns {boolean} - True if the nav is open.
 */
export function getNavState() {
    return isNavOpen;
}

/**
 * Toggles the visibility of the main navigation pill and its associated states.
 */
export function toggleMainNav() {
    isNavOpen = !isNavOpen;

    if (isNavOpen) {
        playNavOpenSound();
    } else {
        playNavCloseSound();
        if (isSettingsMenuOpen) {
            toggleSettingsMenu(); // Close settings if nav is closing
        }
    }

    dom.mainTitleButton.classList.toggle('nav-active', isNavOpen);
    dom.navPill.classList.toggle('is-visible', isNavOpen);
    dom.mainNavContainer.classList.toggle('nav-is-open', isNavOpen);
    
    if (isNavOpen) {
        setTimeout(() => document.body.addEventListener('click', closeNavOnClickOutside), 0);
    } else {
        document.body.removeEventListener('click', closeNavOnClickOutside);
    }
}

/**
 * Toggles the visibility of the settings menu.
 */
function toggleSettingsMenu() {
    isSettingsMenuOpen = !isSettingsMenuOpen;
    dom.settingsMenu.classList.toggle('is-active', isSettingsMenuOpen);
}

/**
 * Initializes the settings menu event listeners.
 */
export function initializeSettings() {
    dom.settingsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSettingsMenu();
    });

    dom.volumeSlider.addEventListener('input', (e) => {
        setVolume(e.target.value);
    });

    // Add touch events for mobile
    dom.volumeSlider.addEventListener('touchstart', (e) => {
        setVolume(e.target.value);
    });
    dom.volumeSlider.addEventListener('touchmove', (e) => {
        setVolume(e.target.value);
    });

    dom.muteToggle.addEventListener('click', () => {
        const isMuted = toggleMute();
        dom.iconVolumeOn.classList.toggle('hidden', isMuted);
        dom.iconVolumeOff.classList.toggle('hidden', !isMuted);
        if (isMuted) {
            dom.volumeSlider.disabled = true;
        } else {
            dom.volumeSlider.disabled = false;
        }
    });

    dom.appIconOptions.addEventListener('click', (e) => {
        const button = e.target.closest('.app-icon-option');
        if (!button) return;

        const iconName = button.dataset.icon;
        // Here you would implement the logic to change the app icon
        // This might involve updating the manifest.json or link tags
        console.log(`Selected app icon: ${iconName}`);

        // Update active state
        dom.appIconOptions.querySelectorAll('.app-icon-option').forEach(opt => opt.classList.remove('active'));
        button.classList.add('active');
    });

    // Set initial state
    dom.volumeSlider.value = 0.5;
    dom.appIconOptions.querySelector('[data-icon="default"]').classList.add('active');
}


/**
 * Closes the navigation if a click occurs outside of the nav container.
 * @param {MouseEvent} event
 */
function closeNavOnClickOutside(event) {
    if (!dom.mainNavContainer.contains(event.target) && event.target !== dom.mainTitleButton) {
        if (isNavOpen) {
            toggleMainNav();
        }
    }
}

/**
 * Shows a specific section of content linked to a nav item.
 * @param {string} newContent - The 'data-content' attribute value of the clicked nav item.
 */
export function showContentForNav(newContent) {
    const newActiveItem = document.querySelector(`.nav-item[data-content="${newContent}"]`);

    if (newContent === activeContent) {
        hideAllContent();
        activeContent = null;
        return;
    }

    hideAllContent();
    activeContent = newContent;

    if (newActiveItem) {
        newActiveItem.classList.add('active');
    }

    let contentToShow;
    switch (newContent) {
        case 'songs':
            contentToShow = dom.songsContent;
            showSongGridWithAnimation();
            break;
        case 'notebook':
            contentToShow = dom.notebookContent;
            break;
        case 'items':
            contentToShow = dom.itemsContent;
            break;
        case 'masks':
            contentToShow = dom.masksContent;
            break;
        case 'heart-containers':
            contentToShow = dom.heartContainersContent;
            break;
        default:
            return;
    }
    
    if (contentToShow) {
        contentToShow.classList.remove('hidden');
    }
}

/**
 * Hides all main content sections and deactivates nav items.
 */
function hideAllContent() {
    dom.allMainContentTypes.forEach(el => el.classList.add('hidden'));
    dom.getNavItems().forEach(item => item.classList.remove('active'));
}

/**
 * Switches the currently active view (e.g., to song detail, maps).
 * @param {HTMLElement} viewToShow - The view container element to make active.
 */
export function switchView(viewToShow) {
    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('is-active'));
    if (viewToShow) {
        viewToShow.classList.add('is-active');
    }
    const isMainScreen = viewToShow === dom.mainScreen;
    
    dom.tingleContainer.style.opacity = isMainScreen ? '1' : '0';
    dom.tingleContainer.style.pointerEvents = isMainScreen ? 'auto' : 'none';
    dom.toggleUiButton.style.display = isMainScreen ? 'flex' : 'none';

    if (isMainScreen) {
        resetHideUiTimeout();
    } else {
        clearTimeout(hideUiTimeout);
        if(isNavOpen) toggleMainNav();
    }
}

/**
 * Calculates the transform properties for the view transition animation.
 * @param {DOMRect} elementRect - The bounding rectangle of the clicked element.
 */
export function getAnimationTransforms(elementRect) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scaleX = elementRect.width / viewportWidth;
    const scaleY = elementRect.height / viewportHeight;
    const translateX = elementRect.left + elementRect.width / 2 - viewportWidth / 2;
    const translateY = elementRect.top + elementRect.height / 2 - viewportHeight / 2;
    return `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
}

/**
 * Resets the timeout that hides the UI toggle button after a period of inactivity.
 */
export function resetHideUiTimeout() {
    clearTimeout(hideUiTimeout);
    dom.toggleUiButton.classList.remove('fade-out');
    hideUiTimeout = setTimeout(() => {
        dom.toggleUiButton.classList.add('fade-out');
    }, 15000); // 15 seconds
}

/**
 * Toggles the visibility of the main screen controls and fairy states.
 */
export function toggleControlsVisibility() {
    const isHidden = dom.mainScreen.classList.toggle('controls-hidden');
    dom.iconEyeOpen.classList.toggle('hidden', isHidden);
    dom.iconEyeClosed.classList.toggle('hidden', !isHidden);
    
    dom.mainNavContainer.classList.toggle('ui-is-hidden', isHidden);

    if (isHidden) {
        exploreInterval = setInterval(() => {
            dom.mainNavContainer.classList.toggle('alt-explore');
        }, 8000);
    } else {
        clearInterval(exploreInterval);
        exploreInterval = null;
        dom.mainNavContainer.classList.remove('alt-explore');
    }
    resetHideUiTimeout();
}
