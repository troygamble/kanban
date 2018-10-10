json.extract! board, :id, :name, :subtitle, :created_at, :updated_at
json.url board_url(board, format: :json)
