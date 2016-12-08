file(GLOB header *.h)
file(GLOB source *.cpp)

set(PRJ_NAME compression)
add_library(compression ${header} ${source})
message("add library compression")

# link with Qt
target_link_libraries( ${PRJ_NAME} ${QT_LIBRARIES} )
	
# link with CGAL
target_link_libraries( ${PRJ_NAME} ${CGAL_LIBRARIES} ${CGAL_3RD_PARTY_LIBRARIES} )

