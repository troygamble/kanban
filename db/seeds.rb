# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

board = [
					{ name: "mcc", subtitle: "Incident management" }
				]

Board.create(board)

list = [
				{ name: "Todo"}, 
				{ name: "inprogress"}, 
				{ name: "done"}
			]
List.create(list)

card = [
				{ name: "card1", content: "This is first card", list_id: 1},
				{ name: "card2", content: "This is seond card", list_id: 1},
				{ name: "card3", content: "This is third card", list_id: 1},
				{ name: "card4", content: "This is forth card", list_id: 1}
			]

Card.create(card)

