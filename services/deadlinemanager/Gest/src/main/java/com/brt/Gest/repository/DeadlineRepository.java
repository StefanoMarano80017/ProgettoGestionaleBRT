package  com.brt.Gest.deadlinemanager.repository;

import com.example.deadlinemanager.model.Deadline;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeadlineRepository extends JpaRepository<Deadline, Long> {
    List<Deadline> findByNotifiedFalse();
}
