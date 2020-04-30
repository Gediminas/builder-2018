import React from 'react'
import Project from './Project'

function Projects(props) {
  let projects = props.projects || []
  return (
    <div className='projects'>
      <div className='table'>
        <div className='row_header'>
          <div className='cell_header'></div>
          <div className='cell_header'>Project</div>
          <div className='cell_header'>Status</div>
          <div className='cell_header'>Accessed</div>
          <div className='cell_header'>debug</div>
        </div>
        {
          projects.map((project) => {
            let project_id = project.get('project_id')
            return <Project key={project_id} project={project} add_task={props.add_task} />
          })
        }
      </div>
    </div>
  )
}

export default Projects;