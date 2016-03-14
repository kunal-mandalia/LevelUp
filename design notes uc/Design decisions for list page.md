Design decisions for /list

1. standardise width

|--------------------------| |--------------------------|
	Goal description

	- action 1 description
	- action 2 description

|--------------------------| |--------------------------|


|--------------------------| |--------------------------|



strategy: fix Goal description and action descriptions length
	e.g. "Develop the habits of good health" -> "Develop the habits of g..."
	e.g. "Swim 2 miles everyday" -> "Swim 2 miles everyday    " (blankspace)

	Width should fit within mobile display width (iPhone 4: 320px)

2. standardise height?

|--------------------------|
|
|	Goal description
|		action description
|		action description
|
|--------------------------|

	case: no actions visible
		- 
|-------------------------------|
|
|	Goal description
|		No actions.
|		Adjust filter, Add action
|		
|
|-------------------------------|

