import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import * as mapboxgl from 'mapbox-gl';
import { image } from 'ionicons/icons';

@Component({
  selector: 'app-add-update-product',
  templateUrl: './add-update-product.component.html',
  styleUrls: ['./add-update-product.component.scss'],
})
export class AddUpdateProductComponent implements OnInit {

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

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  map!: mapboxgl.Map;

  ngOnInit() {
    this.setUserDetails();
    this.initializeMap();
  }


  async takeImage(){
    const dataUrl = (await this.utilsSvc.takePicture('imagen')).dataUrl;
    this.form.controls.image.setValue(dataUrl);

  }



  async setUserDetails() {
    // Obtener el usuario actual y establecer el nombre automáticamente
    const currentUser = this.firebaseSvc.getAuth().currentUser;
    if (currentUser) {
      this.form.controls.name.setValue(currentUser.displayName);
      this.form.controls.uid.setValue(currentUser.uid);
    }
  }

  initializeMap() {
    // Configuración de Mapbox
    (mapboxgl as any).accessToken = 'pk.eyJ1IjoiY2hpbm9za3kiLCJhIjoiY20zMTNtZ3g4MHVyZzJsb2ppMW9pbW44ciJ9.MQ_UsKz_cKAd2ajyN9boPQ';
    this.map = new mapboxgl.Map({
      container: 'map', // ID del contenedor en el HTML
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-70.6483, -33.4569], // Coordenadas iniciales (Santiago, Chile)
      zoom: 12,
      accessToken: (mapboxgl as any).accessToken,
      dragPan: true,  // Habilitar movimiento al arrastrar
      doubleClickZoom: true,  // Zoom con doble clic
      scrollZoom: true,  // Zoom con scroll del ratón
      dragRotate: false,  // Desactivar la rotación del mapa
      touchPitch: false,  // Desactivar inclinación en dispositivos móviles
    });

    let marker: mapboxgl.Marker | null = null;

    // Evento para capturar la ubicación al hacer clic en el mapa
    this.map.on('click', (event) => {
      const coordinates = event.lngLat;
  
      // Si ya hay un marcador, actualizar su posición
      if (marker) {
        marker.setLngLat(coordinates);
      } else {
        // Crear un nuevo marcador y posicionarlo en las coordenadas
        marker = new mapboxgl.Marker({ color: 'red' })
          .setLngLat(coordinates)
          .addTo(this.map);
      }
  
      // Guardar la ubicación seleccionada en el formulario
      this.form.controls.destination.setValue(`${coordinates.lng},${coordinates.lat}`);
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
