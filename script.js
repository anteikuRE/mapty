'use strict'
// prettier-ignore


class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10)
    clicks = 0;

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;

    }

    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        // 
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }

    click() {
        this.clicks++
    }
}

class Running extends Workout {
    type = 'running'
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration)
        this.cadence = cadence
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace
    }


}
class Cycling extends Workout {
    type = 'cycling'

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration)
        this.elevationGain = elevationGain
        // this.type = 'cycling'
        this.calcSpeed()
        this._setDescription();
    }

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60)
        return this.speed
    }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);


//////////////////////////
// APP ARCHITECTURE



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const resetAll = document.querySelector('.reset-all');
// const editBtn = document.querySelector('.edit');
// 
class App {
    #map
    #mapZoomLevel = 13
    #mapEvent;
    #workouts = [];

    constructor() {
        // get user's position
        this._getPosition();

        // Get data from local storage
        this._getLocalStorage();

        // Attach event handlers 
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField)
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))
        resetAll.addEventListener('click', this.resetAll)

        containerWorkouts.addEventListener('click', this._deleteElement.bind(this))
        containerWorkouts.addEventListener('click', this._editElement.bind(this))
    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert('Could not get your position')
            });
    }

    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;

        const coords = [latitude, longitude]

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);


        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // Handling clicks on map
        this.#map.on('click', this._showForm.bind(this))

        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work)
        });
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden')
        inputDistance.focus();
    }

    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

        form.style.display = 'none';
        form.classList.add('hidden')
        setTimeout(() => form.style.display = 'grid', 1000)
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    }

    _newWorkout(e) {
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp))

        const allPositive = (...inputs) => inputs.every(inp => inp > 0)

        e.preventDefault()

        // Get data from
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        // If workout running, create running object 
        if (type === 'running') {
            const cadence = +inputCadence.value;
            // Check if data is valid
            if (
                // !Number.isFinite(distance) ||
                // !Number.isFinite(duration) ||
                // !Number.isFinite(cadence)
                !validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)
            ) return alert('Inputs have to be positive numbers!')

            workout = new Running([lat, lng], distance, duration, cadence)

        }
        // If workout cycling, create cycling object 
        if (type === 'cycling') {
            const elevation = +inputElevation.value;

            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration)
            ) return alert('Inputs have to be positive numbers!')

            workout = new Cycling([lat, lng], distance, duration, elevation)
        }
        // Add new object to workout array
        this.#workouts.push(workout);
        // Render workout on map as marker

        this._renderWorkoutMarker(workout);

        // Render workout on list

        this._renderWorkout(workout);

        // Clear input fields
        this._hideForm();

        // Set local storage to all workouts
        this._setLocalStorage();

    }

    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();
    }

    _renderWorkout(workout) {

        let html = `
        
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <div class="edits">
            <img src="delete.svg" class="delete"/>
            <img src="edit.svg" class="edit"/>
            </div>
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
            </div>
            
            
        `;
        /* <span class="edit">edit</span> */
        // <span class="delete hidden">delete</span>
        // 

        if (workout.type === 'running')
            html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
          <form class="edition_form" action="">
          <input  class="edition_input hidden" placeholder="km" />
          <input class="edition_input hidden" placeholder="min" />
          <input class="edition_input hidden" placeholder="min/km" />
          <input class="edition_input hidden" placeholder="spm" />
          <input type="submit" id="submitbtn" />
          </form>
        </li>

  
        `;
        {/* <div class = "edition hidden">123</div> */ }
        if (workout.type === 'cycling')
            html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
          <form class="edition_form" action="">
          <input  class="edition_input hidden" placeholder="km" />
          <input class="edition_input hidden" placeholder="min" />
          <input class="edition_input hidden" placeholder="km/h" />
          <input class="edition_input hidden" placeholder="spm" />
          <input type="submit" id="submitbtn" />
          </form>
        </li>
        `;

        form.insertAdjacentHTML('afterend', html)
    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        // console.log(workoutEl);
        if (!workoutEl) return;

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id)

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });


    }


    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts))
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'))

        if (!data) return;

        this.#workouts = data;

        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        });
    }

    resetAll() {
        localStorage.removeItem('workouts');
        location.reload();
    }

    removeCurrentModal(e) {
        const asd = e.target.closest('.workout')
        const items = JSON.parse(localStorage.getItem('workouts'));
        const filtered = items.filter(item => item.id !== asd.dataset.id);
        localStorage.setItem('workouts', JSON.stringify(filtered));
        location.reload();
    }

    _deleteElement(e) {
        if (form.classList.contains('hidden')) {
            const asd = e.target.closest('.workout')
            const editImgWrapper = asd.getElementsByClassName('edits');
            const deleteImg = asd.getElementsByClassName('delete');
            const editImg = asd.getElementsByClassName('edit');
            editImgWrapper[0].style.display = 'flex';
            deleteImg[0].style.height = '35px'
            editImg[0].style.height = '35px'
            deleteImg[0].addEventListener("click", this.removeCurrentModal)
        }
    }

    _editElement(e) {
        if (form.classList.contains('hidden')) {
            e.preventDefault();
            const asd = e.target.closest('.workout')
            const editImg = asd.getElementsByClassName('edit');
            const editClass = asd.getElementsByClassName('edition_form');
            const edition = asd.getElementsByClassName('edition_input');
            const editImgWrapper = asd.getElementsByClassName('edits');
            editImg[0].addEventListener("click", function () {
                editClass[0].style.display = 'flex';
                [...edition].forEach(element => {
                    element.classList.remove('hidden')
                    element.style.display = 'flex'
                    element.onkeydown = function (e) {
                        if (e.keyCode == 13) {
                            const newFields = asd.getElementsByClassName('workout__details')
                            newFields[0].getElementsByClassName('workout__value')[0].textContent = edition[0].value
                            newFields[1].getElementsByClassName('workout__value')[0].textContent = edition[1].value
                            newFields[2].getElementsByClassName('workout__value')[0].textContent = edition[2].value
                            newFields[3].getElementsByClassName('workout__value')[0].textContent = edition[3].value

                            editClass[0].style.display = 'none';
                        }
                    };
                });
            })
        }
    }

}

const app = new App();


