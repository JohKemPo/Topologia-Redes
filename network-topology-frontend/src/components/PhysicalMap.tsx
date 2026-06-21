import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { HopResponse } from '../types/topology';

interface PhysicalMapProps {
  hops: HopResponse[];
}

const containerStyle = { width: '100%', height: '400px', borderRadius: '8px' };
const defaultCenter = { lat: -22.8833, lng: -43.1036 };

const mapOptions = { disableDefaultUI: true, zoomControl: true };
const polylineOptions = { strokeColor: '#1890ff', strokeOpacity: 0.8, strokeWeight: 3 };

interface GroupedLocation {
  lat: number;
  lng: number;
  hops: HopResponse[];
}

export const PhysicalMap: React.FC<PhysicalMapProps> = ({ hops }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ?? '') as string,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  
  const lastFitCoordsCount = useRef<number>(0);

  const onLoad = useCallback((mapInstance: google.maps.Map) => setMap(mapInstance), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const { pathCoordinates, groupedLocations, mapBounds } = useMemo(() => {
    const coords: google.maps.LatLngLiteral[] = [];
    const groups = new Map<string, GroupedLocation>();
    const bounds = isLoaded && window.google ? new window.google.maps.LatLngBounds() : null;

    hops.forEach((hop) => {
      if (hop.geo.lat !== null && hop.geo.lng !== null) {
        const point = { lat: hop.geo.lat, lng: hop.geo.lng };
        coords.push(point);
        if (bounds) bounds.extend(point);

        const key = `${hop.geo.lat},${hop.geo.lng}`;
        if (!groups.has(key)) {
          groups.set(key, { lat: hop.geo.lat, lng: hop.geo.lng, hops: [] });
        }
        groups.get(key)!.hops.push(hop);
      }
    });

    return { pathCoordinates: coords, groupedLocations: Array.from(groups.values()), mapBounds: bounds };
  }, [hops, isLoaded]);

  useEffect(() => {
    if (hops.length === 0) {
      lastFitCoordsCount.current = 0;
      return;
    }

    if (map && mapBounds && pathCoordinates.length > 0 && window.google) {
      if (pathCoordinates.length > lastFitCoordsCount.current) {
        
        const ne = mapBounds.getNorthEast();
        const sw = mapBounds.getSouthWest();
        const isSinglePoint = ne && sw && ne.equals(sw);

        if (isSinglePoint || pathCoordinates.length === 1) {
          map.setCenter(pathCoordinates[0]);
          map.setZoom(10);
        } else {
          map.fitBounds(mapBounds);
          
          window.google.maps.event.addListenerOnce(map, 'idle', () => {
            if (map.getZoom()! > 12) {
              map.setZoom(12);
            }
          });
        }
        
        lastFitCoordsCount.current = pathCoordinates.length;
      }
    }
  }, [map, mapBounds, pathCoordinates.length, hops.length]);

  if (!isLoaded) return <div style={{ height: '400px', textAlign: 'center', paddingTop: '180px' }}>Carregando Mapa Físico...</div>;

  return (
    <div style={{ position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={3}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {pathCoordinates.length > 1 && (
          <Polyline
            path={pathCoordinates}
            options={polylineOptions}
          />
        )}

        {groupedLocations.map((group) => {
          const markerKey = `${group.lat}-${group.lng}`;
          const isSelected = activeMarker === markerKey;
          const hopNumbers = group.hops.map(h => h.hop).join(', ');

          return (
            <Marker
              key={markerKey}
              position={{ lat: group.lat, lng: group.lng }}
              label={group.hops.length > 1 ? `${group.hops.length}` : ''}
              onClick={() => setActiveMarker(markerKey)}
            >
              {isSelected && (
                <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                  <div style={{ padding: '8px', maxWidth: '250px', color: '#000' }}>
                    <h4 style={{ margin: '0 0 8px 0' }}>{group.hops[0].geo.city}, {group.hops[0].geo.country}</h4>
                    <p style={{ margin: 0, fontSize: '12px' }}><strong>Saltos englobados:</strong> {hopNumbers}</p>
                    <hr style={{ margin: '8px 0' }} />
                    {group.hops.map(h => (
                      <div key={h.hop} style={{ fontSize: '11px', marginBottom: '4px' }}>
                        <strong>Salto {h.hop}:</strong> {h.ip} <br/>
                        <span style={{ color: '#888' }}>ASN: {h.asn.number || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </InfoWindow>
              )}
            </Marker>
          );
        })}
      </GoogleMap>
      
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(255, 255, 255, 0.9)', padding: '10px 15px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', fontSize: '12px', zIndex: 10 }}>
        <strong style={{ display: 'block', marginBottom: '6px' }}>Legenda Geográfica</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#db4437' }}></div> Datacenter / PoP
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <div style={{ width: '16px', height: '3px', background: '#1890ff' }}></div> Rota via Cabo
        </div>
      </div>
    </div>
  );
};