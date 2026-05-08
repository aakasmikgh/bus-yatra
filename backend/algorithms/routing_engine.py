import sys
import json
import heapq
import math

# Mock Coordinates for A* Heuristic (Approximate)
CITY_COORDS = {
    "Kathmandu": (27.7172, 85.3240),
    "Pokhara": (28.2095, 83.9856),
    "Baglung": (28.2721, 83.6001),
    "Butwal": (27.7006, 83.4484),
    "Biratnagar": (26.4525, 87.2718),
    "Narayanghat": (27.6833, 84.4333),
    "Hetauda": (27.4167, 85.0333),
    "Janakpur": (26.7333, 85.9167),
    "Dharan": (26.8125, 87.2722),
    "Itahari": (26.6667, 87.2667),
    "Birtamod": (26.6333, 87.9833),
}

def get_heuristic(city_a, city_b):
    """Estimated distance for A* (Straight line)"""
    # Normalize for lookup
    ca = city_a.title()
    cb = city_b.title()
    if ca not in CITY_COORDS or cb not in CITY_COORDS:
        return 0
    c1 = CITY_COORDS[ca]
    c2 = CITY_COORDS[cb]
    # Simple Euclidean distance scaled to approx KM
    return math.sqrt((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2) * 111

def dijkstra(graph, start, end):
    """Finds the shortest path based PURELY on distance."""
    # queue: (cost, current, path, route_ids)
    queue = [(0, start.title(), [], [])]
    visited = set()
    target = end.title()
    
    while queue:
        (cost, current, path, route_ids) = heapq.heappop(queue)
        
        if current in visited:
            continue
        
        path = path + [current]
        if current == target:
            return (cost, path, route_ids)
        
        visited.add(current)
        for neighbor, weight, conditions, rid, bname, bnum in graph.get(current, []):
            if neighbor not in visited:
                heapq.heappush(queue, (cost + weight, neighbor, path, route_ids + [{ 'id': rid, 'name': bname, 'number': bnum }]))
    return None

def a_star(graph, start, end):
    """Finds the best path considering Distance, Road Conditions, and Traffic."""
    s_norm = start.title()
    e_norm = end.title()
    # queue: (total_estimated_cost, actual_cost, current_node, path, route_ids)
    queue = [(0 + get_heuristic(s_norm, e_norm), 0, s_norm, [], [])]
    visited = {}
    
    while queue:
        (f_score, g_score, current, path, route_ids) = heapq.heappop(queue)
        
        if current in visited and visited[current] <= g_score:
            continue
        
        path = path + [current]
        if current == e_norm:
            return (g_score, path, route_ids)
        
        visited[current] = g_score
        
        for neighbor, distance, conditions, rid, bname, bnum in graph.get(current, []):
            # Calculate REAL WEIGHT for A*
            weight = (distance * conditions['roadCondition']) + (conditions['trafficDelay'] / 2)
            
            new_g_score = g_score + weight
            new_f_score = new_g_score + get_heuristic(neighbor, e_norm)
            
            if neighbor not in visited or visited[neighbor] > new_g_score:
                heapq.heappush(queue, (new_f_score, new_g_score, neighbor, path, route_ids + [{ 'id': rid, 'name': bname, 'number': bnum }]))
    return None

def main():
    try:
        # Read input from Node.js (stdin)
        input_data = json.loads(sys.stdin.read())
        routes = input_data['routes']
        start_node = input_data['start']
        end_node = input_data['end']
        
        # Build Graph
        graph = {}
        for r in routes:
            origin = r['originName'].title()
            dest = r['destinationName'].title()
            if origin not in graph: graph[origin] = []
            
            conditions = {
                'roadCondition': r.get('roadCondition', 1.0),
                'trafficDelay': r.get('trafficDelay', 0)
            }
            # Add route ID and bus details to the edge data
            graph[origin].append((dest, r.get('distance', 100), conditions, r.get('id'), r.get('busName'), r.get('busNumber')))
            
        # Debug graph
        sys.stderr.write(f"DEBUG: Graph nodes: {list(graph.keys())}\n")
        sys.stderr.write(f"DEBUG: Searching from '{start_node}' to '{end_node}'\n")

        # Run Algorithms
        dijkstra_res = dijkstra(graph, start_node, end_node)
        a_star_res = a_star(graph, start_node, end_node)
        
        result = {
            "dijkstra": {
                "distance": round(dijkstra_res[0], 1) if dijkstra_res else None,
                "path": dijkstra_res[1] if dijkstra_res else [],
                "routeIds": dijkstra_res[2] if dijkstra_res else []
            },
            "a_star": {
                "weighted_score": round(a_star_res[0], 1) if a_star_res else None,
                "path": a_star_res[1] if a_star_res else [],
                "routeIds": a_star_res[2] if a_star_res else []
            }
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
