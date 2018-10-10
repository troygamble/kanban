class SettingsController < ApplicationController
	# resets a database and load the seed file
	def reset_app
		conn = ActiveRecord::Base.connection 
  		tables = ActiveRecord::Base.connection.tables
    	tables.delete "schema_migrations"
	  	tables.each do |t|
	  		conn.execute("TRUNCATE #{t} CASCADE")
	  		conn.reset_pk_sequence!(t)
	  	end
	  	Board.create(name: "[Add Title]", subtitle: "[Add Sub-Title]")
	  	List.create(name: "New")
  		# Rails.application.load_seed
	end
end
