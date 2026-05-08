import sys
import json
import numpy as np
from scipy.spatial import KDTree

def find_nearest_stop(user_lat, user_lng, stops):
    """
    Finds the nearest bus stop using a KD-Tree.
    stops: list of dicts with {'name': str, 'lat': float, 'lng': float}
    """
    if not stops:
        return None

    # Prepare coordinates for KD-Tree
    stop_coords = np.array([[s['lat'], s['lng']] for s in stops])
    stop_names = [s['name'] for s in stops]

    # Build KD-Tree
    tree = KDTree(stop_coords)

    # Query nearest neighbor
    user_coords = np.array([user_lat, user_lng])
    dist, index = tree.query(user_coords, k=1)

    nearest_stop = stops[index]
    
    # Calculate approximate distance in KM (Haversine would be better but Euclidean is fine for small areas)
    # 1 degree lat is approx 111km
    km_dist = dist * 111

    return {
        "name": nearest_stop['name'],
        "lat": nearest_stop['lat'],
        "lng": nearest_stop['lng'],
        "distance": round(km_dist, 2)
    }

def main():
    try:
        # Read input from Node.js (stdin)
        input_data = json.loads(sys.stdin.read())
        user_location = input_data['userLocation']
        stops = input_data['stops']
        
        result = find_nearest_stop(
            user_location['lat'], 
            user_location['lng'], 
            stops
        )
        
        if result:
            print(json.dumps({"success": True, "data": result}))
        else:
            print(json.dumps({"success": False, "error": "No stops found"}))
            
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
