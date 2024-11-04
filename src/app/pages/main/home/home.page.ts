import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateProductComponent } from 'src/app/shared/components/add-update-product/add-update-product.component';
import { addIcons } from 'ionicons';
import { library, playCircle, radio, search } from 'ionicons/icons';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],

  
})
export class HomePage implements OnInit {
  form = new FormGroup({
    uid: new FormControl(''),
    name: new FormControl(''),  // Nombre del usuario logueado
    date: new FormControl(new Date().toLocaleDateString()), // Fecha automática
    time: new FormControl(new Date().toLocaleTimeString()), // Hora automática
    vehiculo: new FormControl('', [Validators.required, Validators.minLength(3)]),
    patente: new FormControl('', [Validators.required, Validators.minLength(6)]),
    espacio: new FormControl('', [Validators.required, Validators.min(1)]),
    price: new FormControl('', [Validators.required, Validators.min(0)]),
    destination: new FormControl('', [Validators.required]), // Destino desde el mapa
    image: new FormControl(''),  // Nombre del usuario logueado
  });
  marker: any;

    ngAfterViewInit() {
      this.initializeMap();
    }
  

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  map!: mapboxgl.Map;

  

  constructor() {
    addIcons({ library, playCircle, radio, search });
  }

  ngOnInit() {
    this.setUserDetails();
  }


  signOut() {
    this.firebaseSvc.signOut();
  }

  addUpdateProduct() {
    this.utilsSvc.presentModal({
      component: AddUpdateProductComponent,
      cssClass: 'add-update-modal',
    });
  }

  async setUserDetails() {
    // Obtener el usuario actual y establecer el nombre automáticamente
    const currentUser = this.firebaseSvc.getAuth().currentUser;
    if (currentUser) {
      this.form.controls.name.setValue(currentUser.displayName);
      this.form.controls.uid.setValue(currentUser.uid);
    }
  }
  async getCurrentLocation() {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
      });
    });
  }


  initializeMap() {

    this.getCurrentLocation().then((currentLocation) => {
      const coordinates: [number, number] = [
        currentLocation.coords.longitude,
        currentLocation.coords.latitude,
      ]; // Asegurarse de que sea una tupla
  
      // Inicializar el mapa con la ubicación actual
      
      (mapboxgl as any).accessToken = 'pk.eyJ1IjoiY2hpbm9za3kiLCJhIjoiY20zM2F1ZXJqMDNiZjJtb2I3bjltcW55diJ9.BG01U7LJQi8POrjF6MzUbg';
      this.map = new mapboxgl.Map({
        container: 'map', // ID del contenedor en el HTML
        style: 'mapbox://styles/mapbox/streets-v11',
        center: coordinates, // Usar ubicación actual
        zoom: 12,
        dragPan: true,  // Habilitar movimiento al arrastrar
        doubleClickZoom: true,  // Zoom con doble clic
        scrollZoom: true,  // Zoom con scroll del ratón
        dragRotate: false,  // Desactivar la rotación del mapa
        touchPitch: false,  // Desactivar inclinación en dispositivos móviles
      });
  
      let marker: mapboxgl.Marker | null = null;
  
      this.map.on('click', (event) => {
        console.log('Clic registrado en el mapa:', event);
        const clickedCoordinates = event.lngLat;
        console.log('Coordenadas clicadas:', clickedCoordinates);

        if (this.marker) {
          this.marker.remove(); // Elimina el marcador anterior
        }
    // Si ya hay un marcador, actualizar su posición
    this.marker = new mapboxgl.Marker({ color: 'red', anchor: 'bottom' })
    .setLngLat([clickedCoordinates.lng, clickedCoordinates.lat]) // Asegúrate de usar un array con [lng, lat]
    .addTo(this.map);
  
        // Guardar la ubicación seleccionada en el formulario
        this.form.controls.destination.setValue(`${clickedCoordinates.lng},${clickedCoordinates.lat}`);
      });
    }).catch((error) => {
      console.error('Error al obtener la ubicación:', error);
      // Manejar error de ubicación si es necesario
    });
  }
  
  async submit() {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();
  
      const path = `trips/${this.form.controls.uid.value}-${new Date().getTime()}`; // Ruta única para el viaje
      this.firebaseSvc.setDocument(path, this.form.value).then(async () => {
        await this.utilsSvc.presentToast({
          message: 'El viaje se ha registrado correctamente',
          duration: 3000,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline'
        });
      }).catch(error => {
        console.error(error);
        this.utilsSvc.presentToast({
          message: error.message,
          duration: 3000,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline'
        });
      }).finally(() => {
        loading.dismiss();
      });
    }
  }
}